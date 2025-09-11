import { Suspense } from "react";
import PaymentFinishClient from "./PaymentFinishClient";

export default function Page() {
  return (
    <Suspense>
      <PaymentFinishClient />
    </Suspense>
  );
}
