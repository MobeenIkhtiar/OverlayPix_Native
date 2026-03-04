export const BASEURL = 'https://overlay-pix-back.onrender.com/api';
// export const BASEURL = 'https://empathetic-spirit-production-8c98.up.railway.app/api';
// export const BASEURL = 'http://192.168.100.15:5001/api';

// 7   5g
// 15  4g

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

    // Payment endpoints - IAP
    validateIAPReceipt: '/payments/validate-iap-receipt',
    createIAPEvent: '/events/create-with-iap',
    upgradeIAPEvent: '/events/upgrade-with-iap',
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

