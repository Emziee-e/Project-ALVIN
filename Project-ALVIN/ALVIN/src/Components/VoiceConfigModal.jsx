import { useEffect, useState } from 'react';
import { ChevronDown, Mic, Pause, Play, X } from 'lucide-react';

const voiceOptions = [
	'Alvin Voice 1 (Alt-Alto)',
	'Alvin Voice 2 (Warm Tenor)',
	'Alvin Voice 3 (Neutral Mid)',
];

const previewClips = [
	{ label: 'Standard Greeting', duration: '0:04s' },
	{ label: 'Technical Analysis', duration: '0:12s' },
];

export default function VoiceConfigModal({ isOpen, modelName, onClose, onUpdate }) {
	const [voice, setVoice] = useState(voiceOptions[0]);
	const [playingClip, setPlayingClip] = useState(null);

	useEffect(() => {
		if (!isOpen) return;

		setVoice(voiceOptions[0]);
		setPlayingClip(null);
	}, [isOpen, modelName]);

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

				<div className="px-5 pt-6">
					<h2 className="font-[Geist,Inter] text-[1.55rem] font-bold tracking-tight text-slate-900">
						Configure Voice
					</h2>
					<div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-[#862334]/10 bg-gray-100 px-3 py-1 text-sm text-slate-600">

						<span>
							Model: <span className="font-semibold text-slate-900">{modelName || 'Unknown'}</span>
						</span>
					</div>
				</div>

				<div className="space-y-4 px-5 pb-5 pt-5">
					<div className="space-y-2.5">
						<label className="block text-[11px] font-Geist tracking-[0.12em] uppercase text-[#a85552]">
							Primary Voice
						</label>
						<div className="relative">
							<select
								value={voice}
								onChange={(event) => setVoice(event.target.value)}
								className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-[15px] text-slate-800 outline-none transition-all duration-200 focus:border-[#862334]/40 focus:shadow-[0_0_0_4px_rgba(134,35,52,0.08)]"
							>
								{voiceOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						</div>
					</div>

					<div className="rounded-[24px] border border-[#e7eefc] bg-gray-100 p-3.5 ">
						<div className="mb-3 text-[11px] font-Geist uppercase tracking-[0.12em] text-slate-500">
							Voice Preview
						</div>

						<div className="space-y-2">
							{previewClips.map((clip, index) => {
								const isPlaying = playingClip === index;

								return (
									<button
										key={clip.label}
										type="button"
										onClick={() => setPlayingClip(isPlaying ? null : index)}
										className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${isPlaying ? 'border-[#862334]/25 bg-white shadow-[0_10px_18px_rgba(134,35,52,0.08)]' : 'border-transparent bg-white/95 shadow-sm hover:border-slate-200 hover:bg-white'}`}
									>
										<span className={`flex h-9 w-9 items-center justify-center rounded-full border ${isPlaying ? 'border-[#ef6a61] bg-[#fff2f2] text-[#ef6a61]' : 'border-slate-300 text-slate-500'}`}>
											{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
										</span>
										<span className="min-w-0">
											<span className="block truncate text-[15px] font-Geist text-slate-900">
												{clip.label}
											</span>
											<span className="block text-xs font-medium text-slate-500">
												{clip.duration}
											</span>
										</span>
									</button>
								);
							})}
						</div>
					</div>

					<button
						type="button"
						onClick={onUpdate}
						className="flex w-full items-center justify-center rounded-2xl bg-[#9e2438] px-4 py-3.5 text-sm font-Geist uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-[#8d1f32]"
					>
						<Mic className="mr-2 h-4 w-4" />
						Update Voice Model
					</button>
				</div>
			</div>
		</div>
	);
}
