import "./globals.css";
import Image from "next/image";
import { Roboto } from "next/font/google";

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
        <div className="lg:flex mb-3 lg:mb-0 items-center bg-base-200 shadow-md sticky top-0 z-50">
          <div className="flex-1 justify-between items-center">
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
          <div className="flex gap-2 items-center lg:w-1/4">
            <div className="form-control w-full">
              <input
                type="text"
                placeholder="Search Anime"
                className="input input-md input-bordered"
              />
            </div>
          </div>
        </div>
        <div>{children}</div>
      </body>
    </html>
  );
}
