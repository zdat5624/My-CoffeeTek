import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });


// === Tự xác định MIME TYPE ===
function getContentType(fileName: string): string {
    const ext = fileName.toLowerCase().split(".").pop() || "";

    switch (ext) {
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "png":
            return "image/png";
        case "gif":
            return "image/gif";
        case "webp":
            return "image/webp";
        case "svg":
            return "image/svg+xml";
        default:
            return "application/octet-stream";
    }
}

// === THƯ MỤC ẢNH ===
//script run: npx ts-node scripts/upload-folder.ts
const folderPath = "C:/Mydata/University/Nam4Hk1/My-CK-NodeJs/product-images/toppings"; // đổi đường dẫn tại đây

async function uploadAll() {
    const bucket = process.env.B2_DEFAULT_BUCKET!;
    const s3 = new S3Client({
        region: process.env.B2_REGION,
        endpoint: process.env.B2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.B2_KEY_ID!,
            secretAccessKey: process.env.B2_APP_KEY!,
        },
    });

    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) continue;

        const fileBuffer = fs.readFileSync(fullPath);
        const contentType = getContentType(file);

        // GIỮ NGUYÊN TÊN FILE
        const key = `${file}`;

        console.log("Uploading:", file);

        await s3.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: fileBuffer,
                ContentType: contentType,
            })
        );

        console.log(`✔ Uploaded: ${file}`);
    }

    console.log("\n=== DONE UPLOAD ALL FILES ===");
}

uploadAll().catch(console.error);
