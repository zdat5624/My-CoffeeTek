"use client";

import React, { useState, useEffect } from "react";
import { Loader2, MapPin, Pencil, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { addressService, AddressResponse, CreateAddressBody } from "@/services/addressService";

interface AddressSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAddressId: number | undefined;
    onSelect: (addr: AddressResponse) => void;
}

export const AddressSelectionDialog: React.FC<AddressSelectionDialogProps> = ({
    open,
    onOpenChange,
    selectedAddressId,
    onSelect
}) => {
    const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
    const [addresses, setAddresses] = useState<AddressResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CreateAddressBody>({
        recipientName: '',
        phoneNumber: '',
        fullAddress: '',
        isDefault: false
    });

    // 1. Fetch Addresses on Open
    useEffect(() => {
        if (open) {
            fetchAddresses();
            setView('LIST');
            resetForm();
        }
    }, [open]);

    const fetchAddresses = async () => {
        setIsLoading(true);
        try {
            const data = await addressService.getAll();
            setAddresses(data);
        } catch (error) {
            toast.error("Failed to load addresses");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ recipientName: '', phoneNumber: '', fullAddress: '', isDefault: false });
        setEditingId(null);
    };

    // 2. Handlers
    const handleSave = async () => {
        if (!formData.recipientName || !formData.phoneNumber || !formData.fullAddress) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                await addressService.update(editingId, formData);
                toast.success("Address updated successfully");
            } else {
                await addressService.create(formData);
                toast.success("Address created successfully");
            }
            await fetchAddresses(); // Refresh list
            setView('LIST');
        } catch (error) {
            toast.error("Failed to save address");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (addr: AddressResponse) => {
        setFormData({
            recipientName: addr.recipientName,
            phoneNumber: addr.phoneNumber,
            fullAddress: addr.fullAddress,
            isDefault: addr.isDefault
        });
        setEditingId(addr.id);
        setView('FORM');
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            await addressService.delete(id);
            toast.success("Address deleted");
            fetchAddresses();
        } catch (error) {
            toast.error("Failed to delete address");
        }
    };

    // ✅ New: Handle Set Default
    const handleSetDefault = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Ngăn chặn việc click vào row chọn địa chỉ
        // Optimistic UI updates hoặc loading nhẹ
        try {
            await addressService.setDefault(id);
            toast.success("Default address updated");
            await fetchAddresses(); // Load lại để server sắp xếp lại thứ tự
        } catch (error) {
            toast.error("Failed to set default address");
        }
    };

    // --- RENDER CONTENT ---
    const renderContent = () => {
        if (view === 'FORM') {
            return (
                <div className="space-y-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="recipientName">Recipient Name</Label>
                        <Input
                            id="recipientName"
                            value={formData.recipientName}
                            onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                            placeholder="Ex: John Doe"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="Ex: 0909..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fullAddress">Full Address</Label>
                        <Input
                            id="fullAddress"
                            value={formData.fullAddress}
                            onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                            placeholder="Ex: 123 Street, City..."
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        />
                        <Label htmlFor="isDefault" className="cursor-pointer">Set as default address</Label>
                    </div>
                </div>
            );
        }

        // LIST VIEW
        if (isLoading) {
            return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-600" /></div>;
        }

        if (addresses.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>No addresses found.</p>
                    <Button variant="link" onClick={() => { resetForm(); setView('FORM'); }}>Create one now</Button>
                </div>
            );
        }

        return (
            <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto pr-1">
                {addresses.map((addr) => (
                    <div
                        key={addr.id}
                        className={`group relative p-4 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr.id
                            ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                            : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                            }`}
                        onClick={() => onSelect(addr)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-gray-900">{addr.recipientName}</p>
                                    <span className="text-gray-400">|</span>
                                    <p className="text-sm text-gray-700">{addr.phoneNumber}</p>
                                    {addr.isDefault && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Default</Badge>}
                                </div>
                                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{addr.fullAddress}</p>
                            </div>
                        </div>

                        {/* Actions Overlay: Luôn hiển thị (đã xóa opacity-0) */}
                        <div className="absolute top-3 right-3 flex gap-1 bg-white/90 rounded-md p-1 shadow-sm border border-gray-100">
                            {/* ✅ Button Set Default */}
                            {!addr.isDefault && (
                                <Button
                                    variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-yellow-500"
                                    title="Set as Default"
                                    onClick={(e) => handleSetDefault(e, addr.id)}
                                >
                                    <Star size={14} />
                                </Button>
                            )}

                            <Button
                                variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600"
                                title="Edit"
                                onClick={(e) => { e.stopPropagation(); handleEdit(addr); }}
                            >
                                <Pencil size={14} />
                            </Button>

                            <Button
                                variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600"
                                title="Delete"
                                onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>
                        {view === 'LIST' ? 'Select Shipping Address' : (editingId ? 'Update Address' : 'Add New Address')}
                    </DialogTitle>
                </DialogHeader>

                {renderContent()}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {view === 'LIST' ? (
                        <>
                            <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setView('FORM'); }}>
                                <Plus className="w-4 h-4 mr-1" /> Add New Address
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setView('LIST')}>Back to List</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Address
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};