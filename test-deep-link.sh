#!/bin/bash

# Test Deep Link Script for PayPal Integration

echo "🔗 PayPal Deep Link Tester"
echo "=========================="
echo ""
echo "Choose platform:"
echo "1) iOS Simulator"
echo "2) Android Emulator"
echo "3) Both"
echo ""
read -p "Enter choice (1-3): " choice

test_ios() {
    echo ""
    echo "📱 Testing iOS Deep Link..."
    echo "Testing Success URL..."
    xcrun simctl openurl booted "overlaypix://paypal/success"
    sleep 2
    echo "Testing Cancel URL..."
    xcrun simctl openurl booted "overlaypix://paypal/cancel"
    echo "✅ iOS test complete"
}

test_android() {
    echo ""
    echo "🤖 Testing Android Deep Link..."
    echo "Testing Success URL..."
    adb shell am start -W -a android.intent.action.VIEW -d "overlaypix://paypal/success" org.reactjs.native.example.overlayPixNew
    sleep 2
    echo "Testing Cancel URL..."
    adb shell am start -W -a android.intent.action.VIEW -d "overlaypix://paypal/cancel" org.reactjs.native.example.overlayPixNew
    echo "✅ Android test complete"
}

case $choice in
    1)
        test_ios
        ;;
    2)
        test_android
        ;;
    3)
        test_ios
        test_android
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Check your app and Metro console for deep link logs!"
