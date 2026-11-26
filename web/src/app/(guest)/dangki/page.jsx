import AuthForm from '../../../components/AuthForm.jsx';

export const metadata = {
    title: 'Đăng ký tài khoản',
    description: 'Tạo tài khoản miễn phí trên NutriVN để bắt đầu theo dõi calo, macro và lộ trình dinh dưỡng cá nhân hóa.',
};

export default function RegisterPage() {
    return <AuthForm mode="register" />;
}
