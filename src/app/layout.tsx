import "./globals.css";
import Image from "next/image";
import { Roboto } from "next/font/google";
import SearchAnime from "@/partials/SearchAnime";
import { Metadata } from "next";
import { FaDiscord, FaGithub } from "react-icons/fa";
import Link from "next/link";

const APP_NAME = "Kitsune";
const APP_DEFAULT_TITLE = "Kitsune | Anime Streaming";
const APP_DESCRIPTION = "Stream your favourite anime with ease and no ads";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_DEFAULT_TITLE,
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  manifest: "/manifest.json",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_DEFAULT_TITLE,

    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
};

const roboto = Roboto({ weight: "400", subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html data-theme="dracula" lang="en" className={roboto.className}>
      <body>
        <div className="navbar bg-base-100">
          <div className="navbar-start">
            <div className="dropdown">
              <label tabIndex={0} className="btn btn-ghost lg:hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h8m-8 6h16"
                  />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/news">News</a>
                </li>
                <li>
                  <a href="/waifu">Waifu</a>
                </li>
              </ul>
            </div>
            <div className="flex items-center">
              <Image src="/icon.png" alt="logo" width="80" height="80" />
              <a
                href="/"
                className="btn btn-ghost font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600 tracking-widest"
              >
                KITSUNE
              </a>
            </div>
          </div>
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/news">News</a>
              </li>
              <li>
                <a href="/waifu">Waifu</a>
              </li>
            </ul>
          </div>
          <div className="navbar-end">
            <div className="w-full lg:w-1/2 hidden lg:block mr-1">
              <SearchAnime />
            </div>
          </div>
        </div>
        <div className="lg:hidden mb-5">
          <SearchAnime />
        </div>
        {children}
        <footer className="w-full bg-base-300 shadow-xl p-5 flex flex-col items-center space-y-5">
          <Image src="/icon.png" alt="logo" width="100" height="100" />
          <div className="flex space-x-5 items-center">
            <a href="https://github.com/Dovakiin0/Kitsune" target="_blank">
              <FaGithub size={25} />
            </a>
            <a href="https://discord.gg/6yAJ3XDHTt" target="_blank">
              <FaDiscord size={25} />
            </a>
          </div>
          <div className="flex space-x-5">
            <Link href="/tos" className="text-gray-300" shallow>
              Terms of Service
            </Link>
            <p>&#9671;</p>
            <Link href="/dmca" className="text-gray-300" shallow>
              DMCA
            </Link>
          </div>
          <p className="text-sm text-gray-300">
            Kitsune does not store any files on our server, we only linked to
            the media which is hosted on 3rd party services.
          </p>
          <p className="text-sm text-gray-300">&copy; Kitsune</p>
        </footer>
      </body>
    </html>
  );
}
