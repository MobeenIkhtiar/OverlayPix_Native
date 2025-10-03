export const BASEURL = 'https://overlay-pix-back.onrender.com/api';
// export const BASEURL = 'https://tlcwd7f2-5000.inc1.devtunnels.ms/api';

export const endPoints = {
    // login: '',
    // signup: '/auth/signup',
    dashboard: '/events/dashboard',
    createEvent: '/events/create',
    getEvent: '/events',
    updateEvent: '/events',
    upgradeEvent: '/events',
    profile: '/events/users',
    deleteUser: '/user/delete-user',
    // Plans endpoints
    getPlans: '/plans',
    // Terms and conditions endpoints
    acceptTerms: '/guests/accept-terms',
    checkTerms: '/guests/check-terms',
    // Overlay endpoints for also admin
    createOverlay: '/admin/overlays',
    getAllOverlays: '/admin/overlays',

    // Payment endpoints
    createPaymentIntent: '/payments/create-intent',
    createCashAppIntent: '/payments/create-cashapp-intent',
    upgradePaymentIntent: '/payments/upgrade-intent',
    upgradeCashAppIntent: '/payments/upgrade-cashapp-intent',
    confirmPayment: '/payments/confirm',
    confirmCashAppIntent: '/payments/confirm-cashapp-intent',
    validateDiscountCode: '/admin/discountcodes/validate',

    //admin
    createPricingPlan: '/plans/create',
    createDiscount: '/admin/discountcodes',
    getActiveEvents: 'admin/dashboard/active-events',
    getAllEvents: "admin/eventpage/events",
    getAllUsers: 'admin/users/users',
    adminDashboardState: 'admin/dashboard/r2-stats',
    updateEventState: 'admin/eventpage/events',
    getActivityLogs: 'admin/audit/activity',
    deleteActivityLog: 'admin/audit',
    getDiscounts: 'admin/discountcodes',
    createDiscountCode: 'admin/discountcodes',
    updateDiscount: 'admin/discountcodes',
    deleteDiscount: 'admin/discountcodes',
    getPricingPlans: 'plans/',
    updatePricingPlan: '/plans',
    deletePricingPlan: '/plans',
    updateOverlay: '/admin/overlays',
    deleteOverlay: 'admin/overlays',
    // deleteUser: 'admin/users/users',
    updateOverlayStatus: 'admin/overlays',

}

