import "./globals.css";
import Image from "next/image";

export const metadata = {
  title: "Kitsune | Anime Streaming",
  description: "Stream your favourite anime with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html data-theme="dracula" lang="en">
      <body>
        <div className="lg:flex items-center bg-base-100 lg:m-5">
          <div className="flex-1 justify-between items-center">
            <div className="flex items-center">
              <Image src="/icon.png" alt="logo" width="100" height="100" />
              <a className="btn btn-ghost font-extrabold text-transparent text-3xl bg-clip-text bg-gradient-to-r from-gray-200 to-pink-600">
                KITSUNE
              </a>
            </div>
          </div>
          <div className="flex gap-2 items-center lg:w-1/3">
            <div className="form-control w-full">
              <input
                type="text"
                placeholder="Search Anime"
                className="input input-bordered"
              />
            </div>
          </div>
        </div>
        <div>{children}</div>
      </body>
    </html>
  );
}
