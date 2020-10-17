import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

export const childFetch = () => {
    return async (dispatch: Function) => {
        try {
            const token = await SecureStore.getItemAsync("token");

            const request = fetch(
                `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/children/mine`,
                {
                    method: "GET",
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` }
                }
            );

            const response = await request;
            if (response.ok) {
                dispatch(childFetch_Success(await response.json()));
            } else {
                dispatch(childFetch_Failure(await response.text()));
            };
        } catch (err) {
            console.warn(err);
            childFetch_Failure("Unexpected error occured!");
        };
    };
};

export const childAdd = (child: User) => {
    return async (dispatch: Function) => {
        dispatch(childAdd_Ready());

        try {
            const token = await SecureStore.getItemAsync("token");
            const request = fetch(
                `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/children/create`,
                {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(child)
                }
            );

            const response = await request;
            if (response.ok) {
                dispatch(childAdd_Success(await response.json(), "Success"));
            } else {
                dispatch(childAdd_Failure(await response.text()));
            };
        } catch (err) {
            console.warn(err);
            childAdd_Failure("Unexpected error occured!");
        };
    };
};

export const childUpdate = (child: User) => {
    return async (dispatch: Function) => {
        dispatch(childUpdate_Ready());

        try {
            const token = await SecureStore.getItemAsync("token");
            const request = fetch(
                `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/children/${child.user_id}`,
                {
                    method: "PUT",
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(child)
                }
            );

            const response = await request;
            if (response.ok) {
                dispatch(childUpdate_Success(await response.json(), "Success"));
            } else {
                dispatch(childUpdate_Failure(await response.text()));
            };
        } catch (err) {
            console.warn(err);
            childUpdate_Failure("Unexpected error occured!");
        };
    };
};

export const childDelete = (child: User) => {
    return async (dispatch: Function) => {
        try {
            const token = await SecureStore.getItemAsync("token");
            const request = fetch(
                `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/children/${child.user_id}`,
                {
                    method: "DELETE",
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                }
            );

            const response = await request;
            if (response.ok) {
                dispatch(childDelete_Complete(child));
            } else {
                console.warn("Unexpected error occured!")
            };
        } catch (err) {
            console.warn(err);
        };
    };
};

const childFetch_Success = (children: User[]) => ({
    type: 'CHILD_FETCH_SUCCESS',
    children: children,
});

const childFetch_Failure = (error: string) => ({
    type: 'CHILD_FETCH_FAILURE',
    error: error
});

const childAdd_Ready = () => ({
    type: 'CHILD_ADD_READY'
});

const childAdd_Success = (child: User, message: string) => ({
    type: 'CHILD_ADD_SUCCESS',
    child: child,
    message: message
});

const childAdd_Failure = (error: string) => ({
    type: 'CHILD_ADD_FAILURE',
    error: error
});

const childUpdate_Ready = () => ({
    type: 'CHILD_UPDATE_READY'
});

const childUpdate_Success = (child: User, message: string) => ({
    type: 'CHILD_UPDATE_SUCCESS',
    child: child,
    message: message
});

const childUpdate_Failure = (error: string) => ({
    type: 'CHILD_UPDATE_FAILURE',
    error: error
});

const childDelete_Complete = (child: User) => ({
    type: 'CHILD_DELETE_COMPLETE',
    child: child
})