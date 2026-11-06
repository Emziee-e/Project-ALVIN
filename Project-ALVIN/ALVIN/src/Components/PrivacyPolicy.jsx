import React from "react";
import { X } from 'lucide-react';

const PrivacyPolicy = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            {/* Modal Container */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="sticky top-0 bg-maroon px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white font-Geist">
                            Privacy Policy
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2"
                    >
                        <X size={24} className="text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="prose prose-sm max-w-none text-gray-700 space-y-4 font-[Manrope,sans-serif]">

                        <p className="text-base leading-relaxed font-Inter">
                            At <strong className="font-Geist">ALVIN</strong> (AI-Powered Learning and Vision-Based Interview Navigation System), we are committed to protecting the privacy, confidentiality, and security of our users' personal and behavioral data. This Privacy Policy outlines how we collect, use, process, and safeguard your information in compliance with Republic Act No. 10173, also known as the <strong className="font-Geist">Data Privacy Act of 2012</strong> of the Philippines.
                        </p>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">1. Information We Collect</h3>
                            <p className="font-Inter">To deliver realistic AI mock interview simulations and tailored performance analytics, ALVIN collects the following categories of data:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                                <li className="font-Inter">
                                    <strong>Account & Profile Information:</strong> Official institutional Google Single Sign-On (SSO) data, including your University of Batangas email address (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">@ub.edu.ph</code>) and display name.
                                </li>
                                <li className="font-Inter">
                                    <strong>Vision & Biometric Cues:</strong> Real-time facial expression data, eye gaze, head movements, and posture metrics processed via MediaPipe to detect confidence levels and interview anxiety.
                                </li>
                                <li className="font-Inter">
                                    <strong>Audio & Conversational Transcripts:</strong> Speech-to-text transcriptions of your spoken interview responses, evaluated for articulation, vocabulary, and grammar.
                                </li>
                                <li className="font-Inter">
                                    <strong>Evaluation Reports & Metrics:</strong> Multi-dimensional scores across appearance and poise, skill presentation, delivery and language, resume fit, and overall performance history.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">2. How We Use Your Information</h3>
                            <p className="font-Inter">Your data is strictly utilized to support career readiness and institutional evaluations. Specifically, we use collected information to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                                <li className="font-Inter">Generate tailored interview questions matching your targeted job role and uploaded resume.</li>
                                <li className="font-Inter">Provide immediate, data-driven feedback and actionable tips to reduce interview anxiety and strengthen communication skills.</li>
                                <li className="font-Inter">Populate student and career advisor dashboards to monitor skill development and academic deployment readiness.</li>
                                <li className="font-Inter">Allow career counselors, internship officers, and department deans to provide direct performance notes and targeted guidance.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">3. Third-Party Integrations & Data Sharing</h3>
                            <p className="font-Inter">ALVIN integrates secure third-party APIs to power its conversational AI, avatar rendering, and computer vision features. Data shared with third parties is strictly limited to operational execution:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                                <li className="font-Inter"><strong>Google Gemini API:</strong> Processes parsed resume contents and response transcriptions to generate dynamic interview questions and feedback.</li>
                                <li className="font-Inter"><strong>NavTalk API:</strong> Facilitates real-time video avatar rendering and voice synchronization during interview sessions.</li>
                                <li className="font-Inter"><strong>Google OAuth:</strong> Handles secure single sign-on authentication for University of Batangas accounts.</li>
                                <li className="font-Inter"><strong>Institutional Staff Access:</strong> Performance reports and transcripts are shared only with authorized University of Batangas career advisors, internship officers, and system administrators. We do not sell or share user data with external commercial entities.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">4. Data Storage and Security</h3>
                            <p className="font-Inter">
                                All application data, interview history, and account records are stored securely using Supabase (PostgreSQL) with Row-Level Security (RLS) enabled. Real-time video scanning via MediaPipe is processed locally on your client device to extract facial landmarks and minimize latency, ensuring that raw video feeds are not permanently archived on external servers.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">5. User Rights Under the Data Privacy Act</h3>
                            <p className="font-Inter">In accordance with the Data Privacy Act of 2012, you have the right to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                                <li className="font-Inter">Access your performance records, evaluation reports, and account information at any time.</li>
                                <li className="font-Inter">Request the correction or update of inaccurate profile details.</li>
                                <li className="font-Inter">Request the deactivation or deletion of your student profile and interview history from the platform.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">6. Changes to This Privacy Policy</h3>
                            <p className="font-Inter">
                                We may update this Privacy Policy from time to time to reflect enhancements in system functionalities, updates to underlying AI models, or changes in institutional policies. Any updates will be published within the ALVIN application.
                            </p>
                        </section>

                        <p className="text-sm text-gray-500 italic mt-8 pt-4 border-t border-gray-100">
                            By accessing and using ALVIN, you acknowledge that you have read, understood, and consented to the data practices described in this Privacy Policy.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-white font-semibold font-Geist rounded-xl bg-maroon"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;