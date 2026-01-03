"use client";
import { redirect } from 'next/navigation';

export default function NewPurchaseRedirectPage() {
    // This page is a client component to handle the new purchase action.
    // It should redirect to the main purchases page. The logic on that page
    // should be updated to handle opening the "new" dialog.
    redirect('/purchases');
    return null;
}
