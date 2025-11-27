import { Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client'; // Import Prisma namespace

const prisma = new PrismaClient();

export async function seedPromotions() {
    Logger.log('🪄 Seeding 21 Promotions (1 Active, 20 Expired)...');

    // 1. CHECK EXISTENCE
    const count = await prisma.promotion.count();
    if (count > 0) {
        Logger.log('⚠️ Promotions already exist → Skip');
        return prisma.promotion.findMany();
    }

    // 2. GET PRODUCTS & SIZES
    const products = await prisma.product.findMany({
        where: { is_multi_size: true },
        include: { sizes: true },
        take: 20,
    });

    if (products.length === 0) {
        Logger.error('❌ No multi-size products found to apply promotion.');
        return [];
    }

    // 3. DEFINE SCENARIOS
    const expiredPromotions = [
        { name: 'Happy New Year 2023', desc: 'Start the year with sweet treats' },
        { name: 'Valentine Special', desc: 'Sweet deals for couples' },
        { name: 'Summer Cool Down 2023', desc: 'Beat the heat with icy drinks' },
        { name: 'Back to School 2023', desc: 'Energy boost for students' },
        { name: 'Mid-Autumn Festival', desc: 'Mooncake and Tea pairing' },
        { name: 'Halloween Spooky Night', desc: 'Scary good prices' },
        { name: 'Black Friday 2023', desc: 'Biggest sale of the year' },
        { name: 'Christmas Joy', desc: 'Holiday season specials' },
        { name: 'Tet Holiday 2024', desc: 'Traditional flavors' },
        { name: 'Women Day March 8', desc: 'For the special women' },
        { name: 'Liberation Day Sale', desc: 'April 30th celebration' },
        { name: 'Hello Summer 2024', desc: 'Refreshing fruit teas' },
        { name: 'Children Day', desc: 'Fun drinks for kids' },
        { name: 'Independence Day', desc: 'National pride specials' },
        { name: 'Rainy Season Comfort', desc: 'Warm drinks for rainy days' },
        { name: 'Cyber Monday', desc: 'Online exclusive deals' },
        { name: 'Winter Warm Up', desc: 'Hot cocoa and coffee' },
        { name: 'Spring Blossom', desc: 'Floral tea collection' },
        { name: 'Late Night Study', desc: 'Caffeine boost for night owls' },
        { name: 'Early Bird Special', desc: 'Morning coffee discount' },
    ];

    const activePromotion = {
        name: 'Winter Warm Up 2025',
        desc: 'Cozy up this winter with our heartwarming discounts on hot beverages and pastries.',
    };

    const today = new Date();

    // --- A. SEED 20 EXPIRED PROMOTIONS ---
    Logger.log('   Generating 20 Expired Promotions...');

    for (let i = 0; i < expiredPromotions.length; i++) {
        const promo = expiredPromotions[i];

        const endDate = new Date();
        endDate.setMonth(today.getMonth() - (i + 1));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        const createdPromo = await prisma.promotion.create({
            data: {
                name: promo.name,
                description: promo.desc,
                start_date: startDate,
                end_date: endDate,
                is_active: false,
            },
        });

        const randomProduct = products[i % products.length];
        const sizeM = randomProduct.sizes.find(s => s.price > 0) || randomProduct.sizes[0];

        if (sizeM) {
            await prisma.productPromotion.create({
                data: {
                    productId: randomProduct.id,
                    promotionId: createdPromo.id,
                    productSizeId: sizeM.size_id,
                    new_price: sizeM.price * 0.8,
                },
            });
        }
    }

    // --- B. SEED 1 ACTIVE PROMOTION ---
    Logger.log(`   Generating Active Promotion: ${activePromotion.name}...`);

    // Set thời gian Active cụ thể
    const activeStart = new Date(today);
    activeStart.setDate(today.getDate() - 2); // Bắt đầu từ 2 ngày trước
    activeStart.setHours(0, 0, 0, 0);         // Lúc 00:00:00

    const activeEnd = new Date(today);

    // SỬA TẠI ĐÂY: Cộng thêm 90 ngày (khoảng 3 tháng)
    activeEnd.setDate(today.getDate() + 90);

    // Hoặc dùng setMonth để cộng đúng 3 tháng theo lịch:
    // activeEnd.setMonth(today.getMonth() + 3);

    activeEnd.setHours(23, 59, 59, 999);      // Lúc 23:59:59

    const activePromoHeader = await prisma.promotion.create({
        data: {
            name: activePromotion.name,
            description: activePromotion.desc,
            start_date: activeStart,
            end_date: activeEnd,
            is_active: true,
        },
    });

    // --- FIX TYPE ERROR HERE ---
    const itemsData: Prisma.ProductPromotionCreateManyInput[] = [];

    const targetProducts = products.slice(0, 15);

    for (const prod of targetProducts) {
        for (const size of prod.sizes) {
            let discountedPrice = size.price * 0.85;
            discountedPrice = Math.floor(discountedPrice / 1000) * 1000;

            itemsData.push({
                productId: prod.id,
                promotionId: activePromoHeader.id,
                productSizeId: size.size_id,
                new_price: discountedPrice,
            });
        }
    }

    await prisma.productPromotion.createMany({
        data: itemsData,
    });

    Logger.log(`✅ Seeded 21 Promotions (1 Active with ${itemsData.length} items)`);
    return prisma.promotion.findMany();
}