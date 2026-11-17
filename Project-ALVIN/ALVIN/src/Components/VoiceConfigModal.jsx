import { ExternalLink, Mic, X } from 'lucide-react';

const NAVTALK_AVATAR_URL = 'https://console.navtalk.ai/avatar';

export default function VoiceConfigModal({ isOpen, onClose }) {
	const openNavTalkDashboard = () => {
		window.open(NAVTALK_AVATAR_URL, '_blank', 'noopener,noreferrer');
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
			role="dialog"
			aria-modal="true"
			aria-labelledby="voice-config-title"
			onClick={onClose}
		>
			<div
				className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100"
				onClick={(event) => event.stopPropagation()}
			>
				{/* Close Button - Overlapping (matches SignOutModal) */}
				<button
					type="button"
					onClick={onClose}
					aria-label="Close voice configuration"
					className="absolute -top-4 -right-4 p-2.5 rounded-full bg-white shadow-xl group hover:scale-110 transition-all border border-gray-100 z-[1001] cursor-pointer"
				>
					<X className="w-5 h-5 text-maroon group-hover:rotate-90 transition-transform duration-200" />
				</button>

				{/* Header/Icon */}
				<div className="pt-6 pb-2 px-6 flex flex-col items-center text-center">
					<div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
						<Mic className="w-6 h-6 text-maroon" aria-hidden="true" />
					</div>
					<h2
						id="voice-config-title"
						className="text-xl font-bold text-gray-900 font-Geist"
					>
						Configure Voice
					</h2>
				</div>

				{/* Content */}
				<div className="px-6 pb-6 text-center">
					<p className="text-sm text-gray-600 mb-6 font-Inter leading-relaxed">
						Voice can only be configured through the NavTalk API dashboard.
						Are you sure you want to leave this page?
					</p>

					<div className="flex flex-col sm:flex-row gap-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98] cursor-pointer"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={openNavTalkDashboard}
							className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm text-white bg-maroon hover:bg-maroon/90 shadow-lg hover:shadow-maroon/20 transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
						>
							<ExternalLink className="w-4 h-4 shrink-0" />
							<span>NavTalk Dashboard</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}