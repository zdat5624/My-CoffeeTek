"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Banner from "@/components/sections/Banner";
import Explore from "@/components/sections/Explore";
import OrderCoffee from "@/components/sections/OrderCoffee";
import InstantCoffee from "@/components/sections/InstantCoffee";
import HomeSections from "@/components/sections/HomeSections";

export default function Home() {
  const searchParams = useSearchParams();
  const loginSuccess = searchParams.get("login");
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (loginSuccess === "success") {
      setShowBanner(true);

      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loginSuccess]);

  return (
    <div className="relative">
      <Banner />
      {/* <Explore /> */}

      <HomeSections />

      <OrderCoffee />

    </div>
  );
}
