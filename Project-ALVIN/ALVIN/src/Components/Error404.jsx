import React from "react";
import { Link } from "react-router-dom";

const Error404 = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-grid-pattern px-4">
            <div className="text-center max-w-2xl">
                <img
                    src="/images/Alvin-logo.png"
                    alt="ALVIN Logo"
                    className="h-24 md:h-32 mx-auto mb-1"
                />

                <div className=" font-Geist text-9xl md:text-10xl font-black mb-6 text-yellow-500">
                    404
                </div>

                <h1 className=" font-Geist text-4xl md:text-5xl text-red-900 mb-4">
                    Page Not Found
                </h1>

                <p className="font-Inter text-lg text-red-900 mb-12 leading-relaxed">
                    Oops! The page you're looking for doesn't. Let's get you back on track.
                </p>

                <Link
                    to="/"
                    className="inline-block px-6 py-2 bg-red-900 text-white font-semibold rounded-lg text-lg"
                >
                    Return to Home
                </Link>
            </div>
        </div>
    );
};

export default Error404;