import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; // Đảm bảo đường dẫn đúng

@Module({
    imports: [PrismaModule],
    controllers: [CartController],
    providers: [CartService],
    exports: [CartService], // Export nếu OrderModule cần dùng để validate cart khi checkout
})
export class CartModule { }