import vitalFitApi from './vitalfitSdk';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface NotificationSettings {
    classReminders: boolean;
    routineUpdates: boolean;
    promotions: boolean;
    systemMessages: boolean;
}

export interface PaginatedNotifications {
    data: Notification[];
    count: number;
    total: number;
    next: string | null;
    previous: string | null;
}

/**
 * Register device push token with the backend
 * (Try/catch kept because it suppresses errors intentionally)
 */
export async function registerDeviceToken(
    token: string,
    deviceToken: string
): Promise<void> {
    try {
        await vitalFitApi.client.post({
            url: '/notifications/register',
            jwt: token,
            data: {
                device_token: deviceToken,
                platform: 'expo',
            },
        });
    } catch (error: unknown) {
        const apiError = error as { status?: number; message?: string };
        if (apiError?.status === 404) {
            return;
        }
    }
}

/**
 * Get user notifications with pagination
 */
export async function getUserNotifications(
    token: string,
    page: number = 1,
    limit: number = 20
): Promise<PaginatedNotifications> {
    // try/catch removed: errors naturally bubble up
    return await vitalFitApi.client.get({
        url: '/notifications',
        jwt: token,
        params: {
            page,
            limit,
        },
    });
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
    token: string,
    notificationId: string
): Promise<void> {
    await vitalFitApi.client.patch({
        url: `/notifications/${notificationId}/read`,
        jwt: token,
    });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(token: string): Promise<void> {
    await vitalFitApi.client.patch({
        url: '/notifications/read-all',
        jwt: token,
    });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(token: string): Promise<number> {
    const response = await vitalFitApi.client.get({
        url: '/notifications/unread-count',
        jwt: token,
    });
    return response.count;
}

/**
 * Get notification settings
 * (Try/catch kept because it provides default values on failure)
 */
export async function getNotificationSettings(
    token: string
): Promise<NotificationSettings> {
    try {
        const settings = await vitalFitApi.client.get({
            url: '/notifications/settings',
            jwt: token,
        });
        return settings;
    } catch {
        return {
            classReminders: true,
            routineUpdates: true,
            promotions: false,
            systemMessages: true,
        };
    }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
    token: string,
    settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
    return await vitalFitApi.client.patch({
        url: '/notifications/settings',
        jwt: token,
        data: settings,
    });
}

/**
 * Delete a notification
 */
export async function deleteNotification(
    token: string,
    notificationId: string
): Promise<void> {
    await vitalFitApi.client.delete({
        url: `/notifications/${notificationId}`,
        jwt: token,
    });
}