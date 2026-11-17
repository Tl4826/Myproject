import { useCallback, useEffect, useRef, useState } from 'react';

// The captured image stays on this device until the user explicitly chooses "Dùng ảnh".
function cameraErrorMessage(error) {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        return 'Camera chỉ hoạt động trên HTTPS hoặc localhost. Hãy mở phiên bản HTTPS của website.';
    }
    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        return 'Bạn chưa cấp quyền camera. Hãy cho phép truy cập camera trong trình duyệt rồi thử lại.';
    }
    if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        return 'Không tìm thấy camera trên thiết bị này.';
    }
    if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
        return 'Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.';
    }
    return 'Không mở được camera trên trình duyệt này. Bạn vẫn có thể chọn ảnh từ thư viện.';
}

export default function CameraCapture({ onClose, onUsePhoto }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const photoUrlRef = useRef(null);
    const requestRef = useRef(0);
    const mountedRef = useRef(false);
    const closeRef = useRef(null);
    const [status, setStatus] = useState('requesting');
    const [error, setError] = useState('');
    const [photo, setPhoto] = useState(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    const startCamera = useCallback(async () => {
        const requestId = ++requestRef.current;
        stopCamera();
        setError('');
        setStatus('requesting');

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Trình duyệt này không hỗ trợ camera trực tiếp hoặc trang chưa chạy trên HTTPS.');
            setStatus('error');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 960 }
                },
                audio: false
            });
            if (!mountedRef.current || requestId !== requestRef.current) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            streamRef.current = stream;
            if (!videoRef.current) throw new Error('Missing video preview');
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            if (!mountedRef.current || requestId !== requestRef.current) return;
            setStatus('ready');
        } catch (err) {
            if (!mountedRef.current || requestId !== requestRef.current) return;
            stopCamera();
            setError(cameraErrorMessage(err));
            setStatus('error');
        }
    }, [stopCamera]);

    useEffect(() => {
        mountedRef.current = true;
        closeRef.current?.focus();
        startCamera();
        return () => {
            mountedRef.current = false;
            requestRef.current += 1;
            stopCamera();
            if (photoUrlRef.current) {
                URL.revokeObjectURL(photoUrlRef.current);
                photoUrlRef.current = null;
            }
        };
    }, [startCamera, stopCamera]);

    useEffect(() => {
        const onKeyDown = event => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const takePhoto = () => {
        const video = videoRef.current;
        if (!video || status !== 'ready' || !video.videoWidth || !video.videoHeight) {
            setError('Camera chưa sẵn sàng. Hãy thử lại.');
            return;
        }

        const maxEdge = Math.max(video.videoWidth, video.videoHeight);
        const scale = Math.min(1, 1600 / maxEdge);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Không thể chụp ảnh trên thiết bị này.');
            return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
            if (!mountedRef.current) return;
            if (!blob) {
                setError('Không thể tạo ảnh. Hãy thử lại.');
                return;
            }
            if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
            const url = URL.createObjectURL(blob);
            photoUrlRef.current = url;
            setPhoto({ blob, url });
            stopCamera();
            setStatus('captured');
        }, 'image/jpeg', 0.88);
    };

    const retake = () => {
        if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
        photoUrlRef.current = null;
        setPhoto(null);
        startCamera();
    };

    const confirmPhoto = () => {
        if (!photo?.blob) return;
        const file = new File([photo.blob], `mon-an-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
        onClose();
        onUsePhoto(file);
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/85 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Chụp ảnh món ăn">
            <div className="mx-auto w-full max-w-lg rounded-3xl bg-white p-4 shadow-2xl sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">📷 Chụp ảnh món ăn</h2>
                        <p className="text-xs text-slate-500">Đặt món ăn trong khung để AI nhận diện.</p>
                    </div>
                    <button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng camera"
                        className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
                        ✕
                    </button>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-black">
                    <video ref={videoRef} autoPlay playsInline muted
                        className={`aspect-[4/3] w-full object-contain ${photo ? 'hidden' : 'block'}`}
                        aria-label="Hình ảnh trực tiếp từ camera" />
                    {photo && <img src={photo.url} alt="Ảnh món ăn vừa chụp" className="aspect-[4/3] w-full object-contain" />}
                    {status === 'requesting' && !photo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4 text-center text-sm font-semibold text-white">
                            Đang yêu cầu quyền truy cập camera...
                        </div>
                    )}
                </div>

                {error && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">{error}</p>}
                <p className="mt-3 text-xs text-slate-500">
                    Ảnh chỉ được gửi đến dịch vụ nhận diện sau khi bạn bấm “Dùng ảnh”.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                    {status === 'ready' && (
                        <button type="button" onClick={takePhoto}
                            className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700">
                            📸 Chụp ảnh
                        </button>
                    )}
                    {status === 'captured' && (
                        <>
                            <button type="button" onClick={retake}
                                className="min-h-11 flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">
                                Chụp lại
                            </button>
                            <button type="button" onClick={confirmPhoto}
                                className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700">
                                ✓ Dùng ảnh
                            </button>
                        </>
                    )}
                    {status === 'error' && (
                        <button type="button" onClick={startCamera}
                            className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">
                            Thử mở camera lại
                        </button>
                    )}
                    <button type="button" onClick={onClose}
                        className="min-h-11 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
}
