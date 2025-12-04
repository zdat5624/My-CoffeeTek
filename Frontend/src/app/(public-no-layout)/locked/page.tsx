// page.tsx
"use client";

import React, { Suspense } from "react";
import LockedPageContent from "./PaymentResultPageContent";

const PaymentResultPage = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <LockedPageContent />
    </Suspense>
);

export default PaymentResultPage;
