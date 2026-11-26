import AuthForm from '../../../components/AuthForm.jsx';

export const metadata = {
    title: 'Đăng nhập',
    description: 'Đăng nhập tài khoản NutriVN để đồng bộ nhật ký ăn uống, quét món ăn AI và xem báo cáo calo 7 ngày.',
};

export default function LoginPage() {
    return <AuthForm mode="login" />;
}
