import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function AvatarPreviewModal({ isOpen, model, onClose }) {
	const videoRef = useRef(null);

	useEffect(() => {
		if (!isOpen) return undefined;

		const video = videoRef.current;
		if (video) {
			video.currentTime = 0;
			video.play().catch(() => {
				// The browser can block playback until the user presses play.
			});
		}

		const handleEscape = (event) => {
			if (event.key === 'Escape') onClose();
		};

		window.addEventListener('keydown', handleEscape);
		return () => {
			window.removeEventListener('keydown', handleEscape);
			video?.pause();
		};
	}, [isOpen, model?.id, onClose]);

	if (!isOpen || !model) return null;

	return (
		<div
			className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="avatar-preview-title"
			onClick={onClose}
		>
			<div
				className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.32)]"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-center justify-between border-b border-slate-100 px-5 py-2">
					<div>
						<p className="text-[15px] font-Geist uppercase text-[#862334]">Avatar Preview</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
						aria-label="Close avatar preview"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="bg-black">
					<video
						key={model.id}
						ref={videoRef}
						className="aspect-video w-full"
						src={model.video}
						poster={model.image}
						autoPlay
						controls
						playsInline
					>
						Your browser does not support video playback.
					</video>
				</div>
			</div>
		</div>
	);
}
