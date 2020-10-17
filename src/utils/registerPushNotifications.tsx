import * as Notifications from 'expo-notifications'
import * as Permissions from 'expo-permissions';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const registerForPushNotifications = async () => {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    if (status !== 'granted') {
        alert('No notification permissions!');
        return;
    }

    // Get the token that identifies this device
    let token = await Notifications.getExpoPushTokenAsync();

    const user: User = await JSON.parse(await SecureStore.getItemAsync("user") || '');
    const PUSH_ENDPOINT = `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/notifications/token/${user.user_id}`;

    // POST the token to your backend server from where you can retrieve it to send push notifications.
    return fetch(PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    });
};

export default registerForPushNotifications;