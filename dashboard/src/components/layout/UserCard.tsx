import { bebas, montserrat } from "@/styles/styles";
import Image from "next/image";

type UserCardProps = {
  name: string;
  role: string;
  avatarUrl?: string;
};

export default function UserCard({ name, role, avatarUrl }: UserCardProps) {
  return (
    <div className="flex items-center border-t border-dotted border-gray-200 px-4 w-full min-h-[100px] lg:w-[742px] lg:h-[100px]">
      <div className="flex-shrink-0 mr-6 lg:mr-[34px]">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${name} avatar`}
            width={72}
            height={72}
            className="rounded-full object-cover w-12 h-12 sm:w-14 sm:h-14 lg:w-[72px] lg:h-[72px] "
          />
        ) : (
          <div className="rounded-full bg-gray-200 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-[72px] lg:h-[72px]">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14c3.866 0 7 3.134 7 7H5c0-3.866 
                   3.134-7 7-7zm0-2a5 5 0 110-10 5 5 0 010 10z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Textos */}
      <div className="truncate">
        <h2
          className={`font-normal text-gray-800 leading-tight tracking-wide ${bebas.className}
            text-2xl sm:text-3xl lg:text-4xl`}
        >
          {name}
        </h2>
        <p
          className={`text-gray-500 text-sm lg:text-base font-medium ${montserrat.className}`}
        >
          {role}
        </p>
      </div>
    </div>
  );
}
