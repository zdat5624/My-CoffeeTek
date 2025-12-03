"use client";

import React from "react";
import {
    Layout,
    Menu,
    Spin,
    theme,
    Typography,
    Button,
    Divider,
    type Breakpoint,
    Tag,
    Empty,
} from "antd";
import { ClockCircleOutlined, GlobalOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ShopOutlined } from "@ant-design/icons";
import { OrderType, type Order } from "@/interfaces";
import dayjs from "dayjs";
import { useDarkMode } from "@/components/providers";
import { getOrderTypeColor, getStatusColor } from "@/utils";
import { ProcessOrderCountDisplay } from "@/components/features/pos";
import Link from "next/link";

const { Sider } = Layout;
const { Text } = Typography;

interface LeftSiderProps {
    onSelect: (orderId: number) => void;
    defaultSelected?: number | null;
    collapsed?: boolean;
    onCollapse?: (collapsed: boolean) => void;
    collapsedWidth?: number;
    breakpoint?: Breakpoint;
    style?: React.CSSProperties;
    orders: Order[];
    loading: boolean;
    fetchOrders: () => void;
}

export default function LeftSider({
    onSelect,
    defaultSelected,
    collapsed = false,
    onCollapse,
    collapsedWidth = 70,
    breakpoint,
    style,
    orders,
    loading,
    fetchOrders,
}: LeftSiderProps) {
    const { token } = theme.useToken();
    const { mode } = useDarkMode();

    const handleToggle = () => {
        if (onCollapse) onCollapse(!collapsed);
    };

    const menuItems = orders.map((order) => {
        // 1. Lấy màu từ Utils
        const statusColor = getStatusColor(order.status);
        const typeColor = getOrderTypeColor(order.orderType);

        // 2. Chọn icon dựa trên OrderType
        const TypeIcon = order.orderType === OrderType.ONLINE ? GlobalOutlined : ShopOutlined;

        return {
            key: order.id.toString(),
            // Tooltip hiển thị khi hover chuột
            title: `Order #${order.id} - ${order.status} - ${order.orderType}`,

            // STYLE CHO KHUNG CHỨA (Container của 1 item)
            style: {
                height: "auto",             // Để nội dung tự giãn, không bị cắt
                minHeight: "70px",
                marginBottom: "8px",        // Khoảng cách giữa các card
                padding: 0,                 // Reset padding mặc định của Menu
                overflow: "hidden",
                borderRadius: "6px",        // Bo góc nhẹ
                border: "1px solid #f0f0f0",
                backgroundColor: "#fff",
                lineHeight: 1.5,            // Reset line-height
            },

            label: collapsed ? (
                // === GIAO DIỆN KHI ĐÓNG (Collapsed) ===
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    padding: '10px 0'
                }}>
                    {/* Hiển thị hình tròn màu theo Status, bên trong là icon Type */}
                    <div style={{
                        width: 36, height: 36,
                        backgroundColor: statusColor, // Màu nền theo trạng thái
                        color: '#fff',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}>
                        <TypeIcon style={{ fontSize: 18 }} />
                    </div>
                </div>
            ) : (
                // === GIAO DIỆN KHI MỞ (Expanded) ===
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    // Border trái dày 5px theo màu Status => Điểm nhấn quan trọng nhất
                    borderLeft: `5px solid ${statusColor}`,
                    padding: "10px 12px",
                    height: "100%",
                    width: "100%"
                }}>
                    {/* Hàng 1: ID và Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 15 }}>
                            ORDER #{order.id}
                        </Text>
                        {/* Tag Status nhỏ gọn góc phải */}
                        <Tag color={statusColor} style={{ margin: 0, fontSize: 10, lineHeight: '18px', border: 'none' }}>
                            {order.status.toLocaleUpperCase()}
                        </Tag>
                    </div>

                    {/* Hàng 2: Loại đơn và Thời gian */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                        {/* Tag hiển thị Loại đơn (Online/POS) dùng màu từ utils */}
                        <Tag
                            color={typeColor}
                            style={{
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '0 6px'
                            }}
                        >
                            <TypeIcon />
                            <span style={{ fontWeight: 500 }}>{order.orderType}</span>
                        </Tag>

                        {/* Thời gian hiển thị nhạt hơn */}
                        <Text type="secondary" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <ClockCircleOutlined style={{ fontSize: 10 }} />
                            {dayjs(order.created_at).format("HH:mm")}
                        </Text>
                    </div>

                    {/* (Tùy chọn) Hàng 3: Hiển thị ngày tháng nếu cần */}
                    <div style={{ marginTop: 4, textAlign: 'right' }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                            {dayjs(order.created_at).format("DD/MM/YYYY")}
                        </Text>
                    </div>
                </div>
            ),
        };
    });


    // console.log(menuItems); // Bạn có thể xoá dòng này nếu không cần

    /**
     * Định nghĩa nội dung Sider dựa trên trạng thái
     */
    const renderSiderContent = () => {
        // 1. Trạng thái Đang tải
        if (loading) {
            return (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.7)", // optional
                        zIndex: 9999,
                    }}
                >
                    <Spin />
                </div>
            );
        }


        // 2. Trạng thái Trống (Tải xong, không có dữ liệu)
        if (!loading && orders.length === 0) {
            return (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        boxSizing: "border-box",
                        overflowY: "hidden"
                    }}
                >
                    {/* Chỉ hiển thị text khi Sider đang mở */}
                    {!collapsed && (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            styles={{ image: { height: 60 } }}
                            description={
                                <Typography.Text>
                                    No orders
                                </Typography.Text>
                            }
                        >
                            <Link href={"/pos"}><Button type="primary">Create Now</Button></Link>
                        </Empty>
                    )}
                </div>
            );
        }

        // 3. Trạng thái có dữ liệu
        return (
            <Menu
                theme={mode}
                mode="inline"
                items={menuItems}
                onClick={({ key }) => onSelect(Number(key))}
                defaultSelectedKeys={
                    defaultSelected ? [defaultSelected.toString()] : []
                }
                style={{
                    borderRight: 0,
                }}
            />
        );
    };

    return (
        <Sider
            theme={mode}
            collapsible
            collapsed={collapsed}
            trigger={null}
            width={220}
            collapsedWidth={collapsedWidth}
            breakpoint={breakpoint}
            onBreakpoint={(broken) => {
                if (onCollapse) onCollapse(broken);
            }}
            style={{
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
                overflowY: "visible",
                transition: "all 0.3s ease",
                overflowX: "hidden",
                ...style,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: !collapsed ? "space-between" : "center",
                    padding: "12px 12px",
                    position: "relative",
                }}
            >
                {/* Tiêu đề căn giữa khi mở */}
                {!collapsed && (
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 500,
                            fontSize: 16,
                        }}
                        className="font-medium text-lg"
                    >
                        <ProcessOrderCountDisplay onCountUpdate={fetchOrders} />
                        <span>Orders</span>
                    </div>
                )}

                {/* Nút toggle */}
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={handleToggle}
                    style={{
                        color: token.colorText,
                        ...(collapsed ? {} : { marginLeft: "auto" }),
                    }}
                />
            </div>

            <Divider style={{ margin: 4 }}></Divider>

            {/* Nội dung menu (đã tách ra logic) */}
            {renderSiderContent()}
        </Sider>
    );
}