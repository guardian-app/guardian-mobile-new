import React, { useCallback, useRef } from 'react';
import { BottomNavigation, } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { default as ParentChildrenScene } from './ParentChildrenScene';
import { default as ParentProfileScene } from './ParentProfileScene';
import { Navigation } from '../types';
import { userLogout } from '../actions';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import { useEffect, useState } from 'react';
import registerForPushNotifications from '../utils/registerPushNotifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

type Props = {
    navigation: Navigation;
};

export type Subscription = {
    remove: () => void;
};

const Dashboard = ({ navigation }: Props) => {
    const dispatch = useDispatch()
    const logout = useCallback(
        () => dispatch(userLogout()),
        [dispatch]
    );

    const [notification, setNotification] = useState(false);
    const notificationListener = useRef<Subscription | null>(null);
    const responseListener = useRef<Subscription | null>();

    useEffect(() => {
        registerForPushNotifications();

        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
            setNotification(notification);
        });

        // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
            console.log(response);
        });
    }, []);

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'children', title: 'Children', icon: 'account-child' },
        { key: 'profile', title: 'Profile', icon: 'account' },
    ]);

    const renderScene = ({ route, jumpTo }: any) => {
        switch (route.key) {
            case 'children':
                return <ParentChildrenScene navigation={navigation} />;
            case 'profile':
                return <ParentProfileScene navigation={navigation} />;
        };
    };

    return (
        <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            sceneAnimationEnabled={true}
        />
    );
};

export default Dashboard;