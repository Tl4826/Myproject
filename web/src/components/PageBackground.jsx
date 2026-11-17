// Nền ấm (kem - cam - vàng) cho các trang sau đăng nhập. Phần màu sắc nằm trong index.css (.pagebg, .glow)
export default function PageBackground() {
    return (
        <div aria-hidden="true" className="pagebg">
            <i className="glow glow-1" />
            <i className="glow glow-2" />
            <i className="glow glow-3" />
        </div>
    );
}
