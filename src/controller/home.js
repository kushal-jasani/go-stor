const {
    getBanner,
    getBannerByBannerIds,
    getBannerDetail,
    getBannerDetailByBannerIds,
    getBannerProductsByProductIds,
    getBannerProductsCountByProductIds,
    getAboutUsCategory,
    getReferralDetails,
    getTotalInvite
} = require('../repository/home');

const {
    getProductsByProductIds,
    getMaxPrice,
    getOtherFilters
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.home = async (req, res, next) => {
    try {
        const [banners] = await getBanner();

        const groupedBanners = banners.reduce((acc, banner) => {
            const { vertical_priority, title, banner_type, is_primary } = banner;

            // Only process banners that are not of type "products"
            if (banner_type !== 'Products' && is_primary) {
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
                image: banner.banner_image,
                is_curated: banner.is_curated
            }));
            return group;
        });

        const productBanners = banners.filter(banner => banner.banner_type === 'Products' && banner.is_primary === 1);
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
        const [banner] = await getBannerByBannerIds(bannerId)
        if (!banner.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 404,
                    msg: 'Invalid BannerId!'
                })
            );
        }

        const { is_curated, banner_type } = banner[0];
        if (is_curated === 0 && banner_type === 'Products') {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 404,
                    msg: 'Invalid BannerId!'
                })
            );
        }
        if (is_curated === 1) {
            const { sub_banner_id } = banner[0];
            if (!sub_banner_id) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 404,
                        msg: 'BannerId not contain subBanner'
                    })
                );
            }
            const parsedSubBannerIds = JSON.parse(sub_banner_id);

            const [banners] = await getBannerByBannerIds(parsedSubBannerIds)
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
                    msg: 'Sub Home Page',
                    data: {
                        bannerDetails
                    }
                })
            );
        } else if (is_curated === 0 && banner_type !== 'Products') {
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

            const [bannerDetail] = await getBannerDetail(bannerId)
            let { product_id } = bannerDetail[0];
            let parsedProductIds = product_id ? JSON.parse(product_id) : undefined;

            let bannerProducts, bannerProductsCount, priceFilter1, filters, brandFilter, otherFilters
            if (product_id !== null) {
                const [maxPrice] = await getMaxPrice({ productId: parsedProductIds });
                priceFilter1 = { min_price: 0, max_price: maxPrice[0].max_price };

                [filters] = await getOtherFilters({ productId: parsedProductIds });
                filters.map(filter => {
                    filter.value_list = JSON.parse(filter.value_list)
                })
                brandFilter = filters.filter(filter => filter.filter_name === "Brand");
                otherFilters = filters.filter(filter => filter.filter_name !== "Brand");

                [bannerProducts] = await getBannerProductsByProductIds({ productId: parsedProductIds, parsedPriceFilter, parsedOtherFilter, sortBy, offset, limit });
                [bannerProductsCount] = await getBannerProductsCountByProductIds({ productId: parsedProductIds, parsedPriceFilter, parsedOtherFilter, sortBy });
            }

            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'Banner Products',
                    data: {
                        products: bannerProducts && bannerProducts.length ? bannerProducts : `No products found`,
                        total_products: bannerProductsCount ? bannerProductsCount.length : 0,
                        filters: {
                            priceFilter: priceFilter1,
                            brandFilter: brandFilter ? brandFilter[0] : undefined,
                            otherFilters
                        }
                    }
                })
            );
        }
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

exports.getAboutUsCategory = async (req, res, next) => {
    try {
        const [category] = await getAboutUsCategory();

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'About Us',
                data: {
                    category
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

exports.getReferralDetails = async (req, res, next) => {
    try {
        const [referral] = await getReferralDetails({ userId: req.user.userId });
        const { code, successful_invite, remaining_reward } = referral[0];

        let [total_invite] = await getTotalInvite(code);
        let totalReward = successful_invite * 250;

        let referralDetails = {
            referral_code: code,
            total_invite: total_invite[0].count,
            successful_invite,
            remaining_reward,
            totalReward
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Referral Details',
                data: {
                    referralDetails
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