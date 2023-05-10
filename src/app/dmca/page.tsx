import React from "react";

export const metadata = {
  title: "Kitsune | DMCA",
};

function page() {
  return (
    <div className="m-5 lg:m-10 flex flex-col space-y-5">
      <div className="h-20"></div>
      <p className="text-3xl">DMCA Takedown Request</p>
      <p>
        Our anime streaming website provides links to content hosted by
        third-party sites. We do not host any of the anime or other content
        ourselves, and we do not have control over the content hosted on these
        third-party sites. We simply provide links to these sites as a service
        to our users.
      </p>
      <p>
        We take copyright infringement very seriously and will promptly remove
        any content that violates copyright laws or the Digital Millennium
        Copyright Act (DMCA) when we are notified of such violations. If you
        believe that any content on our site infringes your copyright or the
        copyright of someone you represent, please send us a DMCA takedown
        notice.
      </p>
      <p>
        To file a DMCA takedown notice, please provide us with the following
        information:
      </p>
      <ul className="list-disc">
        <li>
          Identification of the copyrighted work you claim has been infringed.
        </li>
        <li>
          Identification of the material that you claim is infringing and that
          you want removed, with enough detail so that we may locate it.
        </li>
        <li>Your name, address, telephone number, and email address.</li>
        <li>
          A statement that you have a good faith belief that the use of the
          copyrighted material is not authorized by the copyright owner, its
          agent, or the law.
        </li>
        <li>
          A statement that the information in your notice is accurate and that
          you are the copyright owner or authorized to act on the copyright
          owner's behalf.
        </li>
      </ul>
      <p>
        Please send your DMCA takedown notice to{" "}
        <a href="mailto:kaizoku_luffy@outlook.com" className="underline">
          kaizoku_luffy@outlook.com
        </a>
        . We will promptly investigate and take appropriate action in accordance
        with the DMCA.
      </p>
    </div>
  );
}

export default page;
