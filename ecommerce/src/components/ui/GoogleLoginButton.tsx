import React from "react";

interface GoogleProps {
  text: string;
}

const GoogleLoginButton: React.FC<GoogleProps> = ({ text }) => {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white shadow-lg rounded hover:bg-gray-100 transition"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 533.5 544.3"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.4H272v95.3h146.9c-6.3 34.1-25.1 62.9-53.6 82.2v68.2h86.7c50.7-46.7 81.5-115.6 81.5-195.3z"
          fill="#4285F4"
        />
        <path
          d="M272 544.3c73.6 0 135.3-24.4 180.4-66.2l-86.7-68.2c-24.1 16.2-55 25.8-93.7 25.8-71.9 0-132.7-48.5-154.4-113.7H30.1v71.3c45.2 89.5 138.5 151 241.9 151z"
          fill="#34A853"
        />
        <path
          d="M117.6 321.9c-10.9-32.1-10.9-66.9 0-99l-71.3-71.3C7.6 199.2 0 237.7 0 278.4s7.6 79.2 46.3 126.8l71.3-83.3z"
          fill="#FBBC05"
        />
        <path
          d="M272 107.6c39.9 0 75.8 13.7 104.2 40.7l78.1-78.1C407.3 24.4 345.6 0 272 0 168.5 0 75.2 61.5 30.1 151l87.5 71.3c21.7-65.2 82.5-114.7 154.4-114.7z"
          fill="#EA4335"
        />
      </svg>
      <span className="text-sm font-medium text-gray-700">{text}</span>
    </button>
  );
};

export default GoogleLoginButton;
