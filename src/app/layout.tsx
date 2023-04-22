import "./globals.css";
import Image from "next/image";
import { Roboto } from "next/font/google";
import { FaSearch } from "react-icons/fa";

export const metadata = {
  title: "Kitsune | Anime Streaming",
  description: "Stream your favourite anime with ease",
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
        <div className="navbar bg-base-100 sticky top-0 z-50">
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
                  <a>Genre</a>
                </li>
                <li>
                  <a>News</a>
                </li>
                <li>
                  <a>Waifu</a>
                </li>
              </ul>
            </div>
            <div className="flex items-center">
              <Image src="/icon.png" alt="logo" width="100" height="100" />
              <a
                href="/"
                className="btn btn-ghost font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600 tracking-wide"
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
                <a>Genre</a>
              </li>
              <li>
                <a>News</a>
              </li>
              <li>
                <a>Waifu</a>
              </li>
            </ul>
          </div>
          <div className="navbar-end">
            <div className="form-control w-full lg:w-1/2 hidden lg:block">
              <input
                type="text"
                placeholder="Search Anime"
                className="input input-md input-bordered w-full"
              />
            </div>
            <FaSearch className="lg:hidden mr-10" fontSize={20} />
          </div>
        </div>

        <div>{children}</div>
      </body>
    </html>
  );
}
