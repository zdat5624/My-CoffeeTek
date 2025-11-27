import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRecipes() {
    Logger.log('🪄 Seeding Recipes with Unit Conversion (g/ml -> kg/l)...');

    // 1. GET MASTER DATA (Kèm Unit để check)
    const products = await prisma.product.findMany({
        include: { category: true },
    });

    // Lấy Material kèm Unit để biết nó đang tính bằng kg hay g
    const materials = await prisma.material.findMany({
        include: { Unit: true },
    });

    const sizes = await prisma.size.findMany();

    // Helper: Tìm Material theo Code
    const getMaterial = (code: string) => {
        return materials.find((m) => m.code === code);
    };

    // Helper: Lấy Size ID
    const sizeS = sizes.find((s) => s.name === 'S')?.id;
    const sizeM = sizes.find((s) => s.name === 'M')?.id;
    const sizeL = sizes.find((s) => s.name === 'L')?.id;

    if (!sizeS || !sizeM || !sizeL) {
        Logger.error('❌ Missing sizes S, M, L.');
        return;
    }

    // -------------------------------------------------------
    // HÀM CHUYỂN ĐỔI QUAN TRỌNG
    // Input: Số lượng theo đơn vị nhỏ (g, ml)
    // Output: Số lượng theo đơn vị lưu kho (kg, l)
    // -------------------------------------------------------
    const convertToStorageUnit = (amountSmallUnit: number, materialUnitSymbol: string): number => {
        // Nếu kho lưu là kg hoặc lít -> Chia 1000
        if (['kg', 'l'].includes(materialUnitSymbol)) {
            return parseFloat((amountSmallUnit / 1000).toFixed(5)); // 20g -> 0.02kg
        }
        // Nếu kho lưu là g, ml, cái, hộp -> Giữ nguyên
        return amountSmallUnit;
    };

    // =====================================================================
    // 2. DEFINE FORMULA LOGIC (Dùng đơn vị g và ml)
    // =====================================================================

    const generateIngredients = (productName: string, categoryName: string) => {
        const name = productName.toLowerCase();
        const cat = categoryName.toLowerCase();

        // Khai báo kiểu rõ ràng
        const ingredients: {
            code: string;
            // Định lượng (nhập số g hoặc ml)
            consume: { s: number; m: number; l: number }
        }[] = [];

        // --- LOGIC: CÀ PHÊ (Đơn vị: gam hạt, ml sữa) ---
        if (cat.includes('coffee') || cat.includes('espresso') || cat.includes('americano') || cat.includes('phin') || cat.includes('cold brew')) {
            const beanCode = name.includes('arabica') || name.includes('latte') || name.includes('cappuccino')
                ? 'mat_bean_arabica'
                : 'mat_bean_robusta';

            // 20g, 25g, 30g Cà phê
            ingredients.push({ code: beanCode, consume: { s: 20, m: 25, l: 30 } });

            if (name.includes('milk') || name.includes('latte') || name.includes('bac xiu')) {
                // 30ml, 40ml, 50ml Sữa đặc (Lưu ý: kho đang lưu sữa đặc là 'can' hoặc 'l', code sẽ tự xử lý)
                ingredients.push({ code: 'mat_milk_condensed', consume: { s: 30, m: 40, l: 50 } });
                // 100ml, 150ml, 200ml Sữa tươi
                ingredients.push({ code: 'mat_milk_fresh', consume: { s: 100, m: 150, l: 200 } });
            }
            if (name.includes('sugar') || name.includes('black')) {
                ingredients.push({ code: 'mat_syrup_sugar', consume: { s: 10, m: 15, l: 20 } }); // 10ml đường
            }
        }

        // --- LOGIC: TRÀ (Đơn vị: gam trà, ml syrup) ---
        else if (cat.includes('tea')) {
            let teaCode = 'mat_tea_black';
            if (name.includes('oolong')) teaCode = 'mat_tea_oolong';
            if (name.includes('jasmine') || name.includes('fruit')) teaCode = 'mat_tea_jasmine';
            if (name.includes('matcha')) teaCode = 'mat_matcha_vn';

            // 5g, 7g, 9g Trà lá
            ingredients.push({ code: teaCode, consume: { s: 5, m: 7, l: 9 } });

            if (name.includes('milk')) {
                // 20g, 30g, 40g Bột kem béo
                ingredients.push({ code: 'mat_powder_creamer', consume: { s: 20, m: 30, l: 40 } });
            }
            if (name.includes('fruit') || name.includes('peach') || name.includes('lychee')) {
                // 20ml, 30ml, 40ml Syrup
                ingredients.push({ code: 'mat_syrup_peach', consume: { s: 20, m: 30, l: 40 } });
            }
        }

        // --- LOGIC: FRAPPE (Đơn vị: gam bột, ml sữa) ---
        else if (cat.includes('frappe')) {
            ingredients.push({ code: 'mat_powder_frappe', consume: { s: 20, m: 25, l: 30 } }); // 20g Bột
            ingredients.push({ code: 'mat_milk_fresh', consume: { s: 50, m: 70, l: 100 } });   // 50ml Sữa
            ingredients.push({ code: 'mat_cream_whipping', consume: { s: 30, m: 30, l: 30 } }); // 30ml Kem
        }

        // --- LOGIC: TOPPING (Đơn vị: gam) ---
        else if (cat.includes('topping')) {
            // 50g Topping mỗi phần
            ingredients.push({ code: 'mat_top_pearl', consume: { s: 50, m: 50, l: 50 } });
        }

        return ingredients;
    };

    // =====================================================================
    // 3. EXECUTE SEEDING
    // =====================================================================
    let successCount = 0;

    for (const p of products) {
        if (!p.category) continue;

        // Check Exists
        const existingRecipe = await prisma.recipe.findUnique({
            where: { product_id: p.id },
        });
        if (existingRecipe) continue;

        // Generate (Số liệu ở đây là g, ml)
        const ingredientsList = generateIngredients(p.name, p.category.name);

        if (ingredientsList.length === 0) continue;

        // Create Recipe
        const recipe = await prisma.recipe.create({
            data: {
                Product: { connect: { id: p.id } },
            },
        });

        // Create Details with CONVERSION
        for (const ing of ingredientsList) {
            const material = getMaterial(ing.code);

            if (!material) continue;

            // Lấy đơn vị lưu kho (kg, l, g, ml...)
            const unitSymbol = material.Unit.symbol;

            // Nếu sản phẩm Multi-size (Đồ uống)
            if (p.is_multi_size) {
                await prisma.materialRecipe.createMany({
                    data: [
                        {
                            recipeId: recipe.id, materialId: material.id, sizeId: sizeS,
                            // Convert 20g -> 0.02kg
                            consume: convertToStorageUnit(ing.consume.s, unitSymbol)
                        },
                        {
                            recipeId: recipe.id, materialId: material.id, sizeId: sizeM,
                            consume: convertToStorageUnit(ing.consume.m, unitSymbol)
                        },
                        {
                            recipeId: recipe.id, materialId: material.id, sizeId: sizeL,
                            consume: convertToStorageUnit(ing.consume.l, unitSymbol)
                        },
                    ],
                });
            }
            // Sản phẩm Single-size (Topping)
            else {
                await prisma.materialRecipe.create({
                    data: {
                        recipeId: recipe.id,
                        materialId: material.id,
                        sizeId: null,
                        consume: convertToStorageUnit(ing.consume.m, unitSymbol)
                    },
                });
            }
        }
        successCount++;
    }

    Logger.log(`✅ Seeded Recipes for ${successCount} products (Converted to storage units)`);
    return prisma.recipe.findMany();
}