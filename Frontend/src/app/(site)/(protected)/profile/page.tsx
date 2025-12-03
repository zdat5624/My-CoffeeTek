import { redirect } from 'next/navigation';

export default function ProfilePage() {
    // Tự động chuyển hướng sang tab Info
    redirect('/profile/info');
}