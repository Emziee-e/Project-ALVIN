import React from "react";
import { X } from 'lucide-react';

const TermsOfUse = ({ isOpen, onClose, onAccept }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 ">
            {/* Modal Container */}
            <div className=" bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 ">

                {/* Header */}
                <div className="sticky top-0 bg-maroon px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white font-Geist">
                            ALVIN Terms of Use
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2"
                    >
                        <X size={24} className="text-white" />
                    </button>
                </div>

                {/*Content*/}
                <div className="flex-1 overflow-y-auto px-8 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="prose prose-sm max-w-none text-gray-700 space-y-4 font-[Manrope,sans-serif]">

                        <p className="text-base leading-relaxed font-Inter">
                            Welcome to <strong className="font-Geist">ALVIN</strong> (AI-Powered Learning and Vision-Based Interview Navigation System). By accessing or using the ALVIN web application and its related services, you agree to be bound by these Terms of Use. Please read them carefully.
                        </p>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">1. Acceptance of Terms</h3>
                            <p className="font-Inter">By creating an account, accessing, or using ALVIN, you agree to comply with and be bound by these Terms of Use, as well as our Privacy Policy. If you do not agree, you must discontinue use immediately.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">2. Description of Service</h3>
                            <p className="font-Inter">ALVIN is an AI-driven platform designed to evaluate and enhance interview performance for career readiness. The platform provides:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                                <li className="font-Inter"><strong>Behavioral Tracking:</strong> Real-time facial expression and body language analysis via MediaPipe.</li>
                                <li className="font-Inter"><strong>Vocal Assessment:</strong> Analysis of speech delivery, grammar, and vocabulary.</li>
                                <li className="font-Inter"><strong>Immersive Simulation:</strong> Use of realistic AI Avatars and simulated office environments with background audio.</li>
                                <li className="font-Inter"><strong>Performance Monitoring:</strong> A centralized dashboard for career counselors to track student development.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">3. User Responsibilities</h3>
                            <p className="font-Inter">Users agree to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                                <li className="font-Inter">Provide accurate information and valid resumes for the AI to base the session upon.</li>
                                <li className="font-Inter">Grant the system permission to access the device webcam and microphone for the duration of the interview.</li>
                                <li className="font-Inter">Use the simulation for professional and educational growth purposes only.</li>
                                <li className="font-Inter">Maintain the confidentiality of their University of Batangas (UB) or system credentials.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">4. Prohibited Activities</h3>
                            <p className="font-Inter">Users are prohibited from:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                                <li className="font-Inter">Using ALVIN to record, harass, or impersonate others.</li>
                                <li className="font-Inter">Attempting to manipulate AI results through third-party software or fraudulent inputs.</li>
                                <li className="font-Inter">Reverse-engineering, modifying, or redistributing the behavioral tracking or speech analysis logic.</li>
                                <li className="font-Inter">Using the platform for any purpose other than authorized career development activities.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">5. Consent to AI Processing and Monitoring</h3>
                            <p className="font-Inter">By using ALVIN, you acknowledge and consent to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                                <li className="font-Inter">The collection and real-time analysis of biometric cues (facial expressions, mannerisms, and vocal delivery).</li>
                                <li className="font-Inter">The sharing of performance data, including confidence levels and communication metrics, with designated institutional staff and career counselors for the purpose of targeted interventions.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">6. Data Privacy and Security</h3>
                            <p className="font-Inter">ALVIN is committed to protecting your professional and behavioral data. All information, including uploaded resumes and performance grades, is handled in accordance with the Data Privacy Act of 2012. While we implement reasonable security measures, we cannot guarantee absolute protection against unauthorized access.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">7. Disclaimer of Warranties</h3>
                            <p className="font-Inter">ALVIN is provided on an "as is" and "as available" basis. While the system uses advanced AI to provide objective measurements, we make no warranties regarding:</p>
                            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                                <li className="font-Inter">The absolute accuracy of behavioral flags or grammar grading.</li>
                                <li className="font-Inter">Specific employment outcomes or job offers resulting from the use of the platform.</li>
                                <li className="font-Inter">Continuous, error-free operation of the MediaPipe or AI Avatar components.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">8. Limitation of Liability</h3>
                            <p className="font-Inter">To the maximum extent permitted by law, ALVIN, its developers, and the University of Batangas shall not be liable for any indirect, incidental, or consequential damages—including "interview anxiety" or missed professional opportunities—arising from your use of the service.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">9. Account Suspension or Termination</h3>
                            <p className="font-Inter">ALVIN reserves the right to suspend or terminate access for any user who violates these Terms of Use or engages in behavior that disrupts the simulation environment.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">10. Modifications to Terms</h3>
                            <p className="font-Inter">We may update or modify these Terms of Use at any time to reflect technological updates in the AI models or institutional policy changes. Continued use of ALVIN implies acceptance of the revised terms.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">11. Governing Law</h3>
                            <p className="font-Inter">These Terms of Use are governed by the applicable laws of the Republic of the Philippines.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-Geist text-maroon mt-6 mb-3">12. Contact Information</h3>
                            <p className="font-Inter">For questions or feedback regarding the ALVIN system, please contact:</p>
                            <div className="bg-gray-50 p-4 rounded-lg mt-3 text-sm text-gray-600">
                                <p className="font-Inter"><strong>ALVIN Development Team</strong></p>
                                <p className="font-Inter">College of Information and Communications Technology (CICT)</p>
                                <p className="font-Inter">University of Batangas</p>
                                <p className="font-Inter font-semibold">Email: 2301565@ub.edu.ph | John Manuel C. Policarpio III</p>
                                <p className="font-Inter font-semibold">Email: 2204421@ub.edu.ph | John Ashley C. Alday</p>
                                <p className="font-Inter font-semibold">Email: 2201238@ub.edu.ph | Vin Vernon V. Perez</p>
                            </div>
                        </section>

                        <p className="text-sm text-gray-500 italic mt-8 pt-4 border-t border-gray-100">
                            By using ALVIN, you acknowledge that you have read, understood, and agreed to these Terms of Use.
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

export default TermsOfUse;