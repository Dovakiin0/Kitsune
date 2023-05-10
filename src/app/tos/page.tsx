import React from "react";

export const metadata = {
  title: "Kitsune | Terms of Service",
};

function page() {
  return (
    <div className="m-5 lg:m-10 flex flex-col space-y-5">
      <div className="h-20"></div>
      <p className="text-3xl">Terms of Service</p>
      <p>
        By using our website, you agree to be bound by the following terms and
        conditions ("Terms of Service"). If you do not agree to these Terms of
        Service, please do not use our website.
      </p>
      <p className="font-bold">Use of Website</p>
      <p>
        You may use our website for your personal, non-commercial use only. You
        may not use our website for any illegal or unauthorized purpose. You
        agree to comply with all applicable laws and regulations in your use of
        our website.
      </p>
      <p className="font-bold">Intellectual Property</p>
      <p>
        All content on our website, including but not limited to text, graphics,
        images, logos, and software, is the property of our website or its
        licensors and is protected by United States and international copyright
        laws. You may not reproduce, distribute, display, or transmit any
        content on our website without our prior written permission.
      </p>
      <p className="font-bold">User Content</p>
      <p>
        You may submit content to our website, including but not limited to
        comments, reviews, and ratings. By submitting content to our website,
        you grant us a non-exclusive, worldwide, royalty-free, perpetual,
        irrevocable, and fully sublicensable license to use, reproduce, modify,
        adapt, publish, translate, create derivative works from, distribute, and
        display such content in any form, media, or technology now known or
        hereafter developed.
      </p>
      <p className="font-bold">Disclaimer of Warranties</p>
      <p>
        Our website is provided on an "as is" and "as available" basis. We make
        no representations or warranties of any kind, express or implied, as to
        the operation of our website or the information, content, materials, or
        products included on our website. You expressly agree that your use of
        our website is at your sole risk.
      </p>
      <p className="font-bold">Limitation of Liability</p>
      <p>
        In no event shall our website or its affiliates be liable for any
        direct, indirect, incidental, special, or consequential damages arising
        out of or in connection with your use of our website or the content on
        our website. Some states or jurisdictions do not allow the exclusion or
        limitation of liability for consequential or incidental damages, so the
        above limitation may not apply to you.
      </p>
      <p className="font-bold">Indemnification</p>
      <p>
        You agree to indemnify and hold harmless our website and its affiliates
        from any claim or demand, including reasonable attorneys' fees, made by
        any third party due to or arising out of your use of our website, your
        violation of these Terms of Service, or your violation of any rights of
        another.
      </p>
      <p className="font-bold">Modification of Terms</p>
      <p>
        We reserve the right to modify these Terms of Service at any time. Your
        continued use of our website after any such modification constitutes
        your acceptance of the modified Terms of Service.
      </p>
      <p className="font-bold">Governing Law</p>
      <p>
        These Terms of Service shall be governed by and construed in accordance
        with the laws of the United States and the State of [insert state]. Any
        disputes arising out of or related to these Terms of Service shall be
        resolved exclusively in the state or federal courts located in [insert
        county, state].
      </p>
    </div>
  );
}

export default page;
