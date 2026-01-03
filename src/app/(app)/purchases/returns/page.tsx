"use client";
import { redirect } from 'next/navigation';

export default function PurchaseReturnsRedirectPage() {
    // This page is a client component to handle the tab selection.
    // It should redirect to the main purchases page with a query param or similar
    // to activate the "returns" tab. For now, we'll redirect to the main page.
    redirect('/purchases');
    return null;
}
