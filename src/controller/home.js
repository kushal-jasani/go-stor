const {
    getBanner,
    getBannerDetail,
    getBannerDetailByBannerIds,
    getBannerProducts,
    getBannerProductCount
} = require('../repository/home');

const {
    getProductsByProductIds,
    getMaxPrice,
    getOtherFilters
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

const mergeSpecValues = (array1, array2) => {
    // Create a map to store combined results
    const map = {};

    // Populate the map with entries from array1
    array1.forEach(item => {
        map[item.spec_key] = {
            spec_key: item.spec_key,
            spec_values: new Set(item.spec_values)
        };
    });

    // Merge entries from array2 into the map
    array2.forEach(item => {
        if (map[item.spec_key]) {
            // If the spec_key exists, merge the spec_values
            item.spec_values.forEach(value => map[item.spec_key].spec_values.add(value));
        } else {
            // If the spec_key does not exist, add the new entry
            map[item.spec_key] = {
                spec_key: item.spec_key,
                spec_values: new Set(item.spec_values)
            };
        }
    });

    // Convert the map back to an array, converting sets to arrays
    return Object.values(map).map(item => ({
        spec_key: item.spec_key,
        spec_values: Array.from(item.spec_values)
    }));
}

exports.home = async (req, res, next) => {
    try {
        const [banners] = await getBanner();

        const groupedBanners = banners.reduce((acc, banner) => {
            const { vertical_priority, title, banner_type } = banner;

            // Only process banners that are not of type "products"
            if (banner_type !== 'Products') {
                if (!acc[vertical_priority]) {
                    acc[vertical_priority] = { title: title || "", banner_type, vertical_priority, banners: [] };
                }
                acc[vertical_priority].banners.push(banner);
            }

            return acc;
        }, {});

        // Sort each group by horizontal_priority and transform into desired format
        const groupedBannerDetails = Object.values(groupedBanners).map(group => {
            group.banners = group.banners.sort((a, b) => a.horizontal_priority - b.horizontal_priority).map(banner => ({
                id: banner.banner_id,
                image: banner.banner_image
            }));
            return group;
        });

        const productBanners = banners.filter(banner => banner.banner_type === 'Products');
        // Fetch banner descriptions and products, then build the groupedBannerDetails for product banners
        const bannerIds = productBanners.map(banner => banner.banner_id);
        const [bannerDescriptions] = await getBannerDetailByBannerIds(bannerIds);
        const productIds = bannerDescriptions
            .map(bannerDescription => bannerDescription.product_id ? JSON.parse(bannerDescription.product_id) : [])
            .flat();

        let productGroupedBannerDetails;
        if (productIds.length > 0) {
            // Fetch all product details in one go
            const [products] = await getProductsByProductIds(productIds);

            // Create a map for easy lookup of product details by product_id
            const productsMap = products.reduce((acc, product) => {
                acc[product.product_id] = product;
                return acc;
            }, {});

            // Combine the details
            productGroupedBannerDetails = productBanners.map(banner => {
                const { vertical_priority, title, banner_type, banner_id } = banner;
                const bannerDescription = bannerDescriptions.find(desc => desc.banner_id === banner_id);
                const productIds = bannerDescription.product_id ? JSON.parse(bannerDescription.product_id) : [];

                return {
                    title: title || "",
                    banner_type,
                    vertical_priority,
                    products: productIds.map(id => productsMap[id]).filter(product => product)
                };
            }).filter(detail => detail.products.length > 0); // Filter out any entries without products
        }

        let bannerDetails = [...groupedBannerDetails, ...productGroupedBannerDetails].sort((a, b) => a.vertical_priority - b.vertical_priority)

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Home',
                data: {
                    bannerDetails
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.getProductsByBannerId = async (req, res, next) => {
    try {
        const bannerId = req.params.bannerId;
        let { priceFilter, others, sortBy } = req.query;
        let parsedPriceFilter, parsedOtherFilter;
        try {
            parsedPriceFilter = priceFilter ? JSON.parse(priceFilter) : undefined;
            parsedOtherFilter = others ? JSON.parse(others) : [];
        } catch (error) {
            console.error('Error parsing filters: ', error);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        let bannerDiscount;
        const [bannerDetail] = await getBannerDetail(bannerId)
        let { category_id, subcategory_id, key, value, specification_key, specification_value } = bannerDetail[0];

        if (key === 'discount upto') {
            bannerDiscount = value
        }

        let max = 0, otherFilters1, otherFilters2, otherFilters;
        if (specification_key === null) {
            if (category_id !== null) {
                let [categoryMaxPrice] = await getMaxPrice({ category_id })
                max = Math.max(max, categoryMaxPrice[0].max_price);
                [otherFilters1] = await getOtherFilters({ categoryIds: JSON.parse(category_id) });
            }
            if (subcategory_id !== null) {
                let [subcategoryMaxPrice] = await getMaxPrice({ subcategory_id })
                max = Math.max(max, subcategoryMaxPrice[0].max_price);
                [otherFilters2] = await getOtherFilters({ subCategoryIds: JSON.parse(subcategory_id) });
            }

            if (otherFilters1 && otherFilters2) {
                otherFilters = mergeSpecValues(otherFilters1, otherFilters2);
            } else if (otherFilters1) {
                otherFilters = otherFilters1
            } else if (otherFilters2) {
                otherFilters = otherFilters2
            }
        } else if (specification_key !== null && specification_value !== null) {
            let parsedSpecificationValue = JSON.parse(specification_value);

            if (parsedOtherFilter.hasOwnProperty(specification_key)) {
                let existingValues = new Set(parsedOtherFilter[specification_key]);
                for (let value of parsedSpecificationValue) {
                    existingValues.add(value.toString());
                }
                parsedOtherFilter[specification_key] = Array.from(existingValues);
            } else {
                parsedOtherFilter[specification_key] = parsedSpecificationValue.map(value => value.toString());
            }

            let [spKeyMaxPrice] = await getMaxPrice({ category_id, subcategory_id, specification_key, specification_value })
            max = Math.max(max, spKeyMaxPrice[0].max_price);
            [otherFilters] = await getOtherFilters({ categoryIds: JSON.parse(category_id), specification_key, specification_value });
        }
        const priceFilter1 = { min_price: 0, max_price: max };

        const [products] = await getBannerProducts({ categoryId: category_id, subCategoryId: subcategory_id, bannerDiscount, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit });
        const [bannerProductsCount] = await getBannerProductCount({ categoryId: category_id, subCategoryId: subcategory_id, bannerDiscount, parsedPriceFilter, parsedOtherFilter, sortBy });

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Banner Products fetched!',
                data: {
                    products: products.length ? products : `No products found`,
                    total_products: bannerProductsCount.length,
                    filters: {
                        priceFilter1,
                        otherFilters
                    }
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}