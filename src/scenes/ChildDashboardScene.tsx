import React, { useCallback, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { useDispatch, useSelector } from 'react-redux';
import {
    Logo,
    Header,
    Paragraph,
    Button,
    Background
} from '../components';
import { Navigation, User } from '../types';
import { userLogout } from '../actions';
import { LocationGeofencingEventType, LocationRegion } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

type Props = {
    navigation: Navigation;
};

TaskManager.defineTask("childGeofences", async ({ data, error }: { data: any, error: any }) => {
    if (error) {
        console.warn(error);
        return;
    };

    const user: User = await JSON.parse(await SecureStore.getItemAsync("user") || '');

    if (data.eventType)
        if (data.eventType === LocationGeofencingEventType.Enter) {
            console.log("You've entered region:", data.region);
            await fetch(
                `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/notifications/message/${user.parent_id}`,
                {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        child_id: user.user_id,
                        geofence_id: parseInt(data.region.identifier),
                        special_word: "entered"
                    }),
                }
            );

        } else if (data.eventType === LocationGeofencingEventType.Exit) {
            console.log("You've left region:", data.region);
            await fetch(
                `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/notifications/message/${user.parent_id}`,
                {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        child_id: user.user_id,
                        geofence_id: parseInt(data.region.identifier),
                        special_word: "left"
                    }),
                }
            );
        }
});

const Dashboard = ({ navigation }: Props) => {
    const currentUser = useSelector((state: any) => state.userReducer.currentUser);
    const dispatch = useDispatch();
    const _userLogout = useCallback(
        () => dispatch(userLogout()), [dispatch]
    );

    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync("token");
            const user = await JSON.parse(await SecureStore.getItemAsync("user") || '');
            try {
                let { status } = await Location.requestPermissionsAsync();
                if (status !== 'granted') setErrorMsg('Permission to access location was denied');
            } catch (err) {
                console.warn(err);
            };

            try {
                let location = await Location.getCurrentPositionAsync({ accuracy: 4 });
                await fetch(
                    `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/location/${user.user_id}`,
                    {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(location.coords)
                    }
                );
            } catch (err) {
                console.warn(err);
            };

            try {
                const response = await fetch(
                    `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/geofence/${user.user_id}`,
                    {
                        method: "GET",
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                    }
                );

                if (response.ok) {
                    const data: any[] = await response.json();
                    await Location.startGeofencingAsync("childGeofences", data.map(geofence => ({
                        longitude: parseFloat(geofence.longitude),
                        latitude: parseFloat(geofence.latitude),
                        radius: geofence.radius,
                        identifier: geofence.geofence_id ? String(geofence.geofence_id) : undefined,
                    })));

                    console.log("Geofencing task created successfully!");
                } else {
                    console.warn(await response.text());
                }
            } catch (err) {
                console.warn(err);
            };


        })();
    }, []);

    return (
        <Background>
            <Logo />
            <Header>{`${currentUser.first_name} ${currentUser.last_name}`}</Header>
            <Paragraph>
                Your location is being transmitted in the background.
                {errorMsg}
            </Paragraph>
            <Button mode="outlined" onPress={_userLogout}>
                Logout
            </Button>
        </Background>
    );
};

export default Dashboard;