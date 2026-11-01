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
			className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md"
			onClick={onClose}
		>
			<div
				className="relative w-full max-w-sm overflow-hidden rounded-[28px] bg-[#fcfcfd] shadow-[0_24px_70px_rgba(15,23,42,0.24)] ring-1 ring-black/5"
				onClick={(event) => event.stopPropagation()}
			>
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
					aria-label="Close voice configuration"
				>
					<X className="h-6 w-6" />
				</button>

				<div className="px-5 pb-2 pt-6">
					<h2 className="font-[Geist,Inter] text-[1.55rem] font-bold tracking-tight text-slate-900">
						Configure Voice
					</h2>
				</div>

				<div className="space-y-5 px-5 pb-6 pt-4">
					<p className="text-sm leading-6 text-slate-600">
						Voice can only be configured through the NavTalk API dashboard.
						Are you sure you want to leave this page?
					</p>

					<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={openNavTalkDashboard}
							className="flex items-center justify-center rounded-2xl bg-[#9e2438] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8d1f32]"
						>
							<ExternalLink className="mr-2 h-4 w-4" />
							Go to NavTalk Dashboard
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}