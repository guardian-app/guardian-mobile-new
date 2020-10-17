import React, { memo, useState, useEffect } from 'react';
import { Appbar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux'
import {
    PlainBackground,
    TextInput,
    Button
} from '../components';
import {
    emailValidator,
    passwordValidator,
    confirmPasswordValidator,
    nameValidator,
    addressValidator,
    phoneValidator
} from '../utils/validators';
import { userUpdate } from '../actions';
import { User, Navigation } from '../types';
import { colors, theme } from '../styles';

type Props = {
    navigation: Navigation;
};

const EditProfile = ({ navigation }: Props) => {
    const updateError: string = useSelector((state: any) => state.userReducer.updateError);
    const currentUser: User = useSelector((state: any) => state.userReducer.currentUser);

    const [password, setPassword] = useState({ value: '', error: '' });
    const [confirmPassword, setConfirmPassword] = useState({ value: '', error: '' });
    const [firstName, setFirstName] = useState({ value: currentUser.first_name, error: '' });
    const [lastName, setLastName] = useState({ value: currentUser.last_name, error: '' })
    const [address, setAddress] = useState({ value: currentUser.address, error: '' });
    const [phoneNumber, setPhoneNumber] = useState({ value: currentUser.phone_number, error: '' });
    const [submitted, setSubmitted] = useState(false);

    const dispatch = useDispatch()
    const _userUpdate = (user: User) => dispatch(userUpdate(user));

    const _onUpdatePressed = () => {
        const passwordError = password.value && passwordValidator(password.value);
        const confirmPasswordError = password.value && confirmPasswordValidator(password.value, confirmPassword.value);
        const firstNameError = nameValidator(firstName.value || '', 'First');
        const lastNameError = nameValidator(lastName.value || '', 'Last');
        const addressError = addressValidator(address.value || '');
        const phoneNumberError = phoneValidator(phoneNumber.value || '');

        if (passwordError || confirmPasswordError || firstNameError || lastNameError || addressError || phoneNumberError) {
            setPassword({ ...password, error: passwordError });
            setConfirmPassword({ ...confirmPassword, error: confirmPasswordError });
            setFirstName({ ...firstName, error: firstNameError });
            setLastName({ ...lastName, error: lastNameError });
            setAddress({ ...address, error: addressError });
            setPhoneNumber({ ...phoneNumber, error: phoneNumberError });
            return;
        };

        _userUpdate({
            email_address: currentUser.email_address,
            password: password.value,
            first_name: firstName.value,
            last_name: lastName.value,
            address: address.value,
            phone_number: phoneNumber.value,
        });

        setSubmitted(true);
    };

    useEffect(() => {
        if (submitted && !updateError.length) navigation.goBack();
    }, [updateError, submitted]);

    return (
        <>
            <Appbar.Header>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title="Edit Profile" />
            </Appbar.Header>

            <PlainBackground>
                <ScrollView style={styles.container}>
                    <TextInput
                        label="Email"
                        returnKeyType="next"
                        value={currentUser.email_address}
                        disabled
                    />

                    <Text>You cannot change your e-mail address.</Text>

                    <TextInput
                        label="Password"
                        returnKeyType="next"
                        value={password.value}
                        onChangeText={text => setPassword({ value: text, error: '' })}
                        error={!!password.error}
                        errorText={password.error}
                        secureTextEntry
                    />


                    <TextInput
                        label="Confirm password"
                        returnKeyType="next"
                        value={confirmPassword.value}
                        onChangeText={text => setConfirmPassword({ value: text, error: '' })}
                        error={!!confirmPassword.error}
                        errorText={confirmPassword.error}
                        secureTextEntry
                        
                    />

                    <Text>Leave the password fields empty if you don't want to change the password.</Text>

                    <TextInput
                        label="First name"
                        returnKeyType="next"
                        value={firstName.value}
                        onChangeText={text => setFirstName({ value: text, error: '' })}
                        error={!!firstName.error}
                        errorText={firstName.error}
                    />

                    <TextInput
                        label="Last name"
                        returnKeyType="next"
                        value={lastName.value}
                        onChangeText={text => setLastName({ value: text, error: '' })}
                        error={!!lastName.error}
                        errorText={lastName.error}
                    />

                    <TextInput
                        label="Address"
                        returnKeyType="next"
                        value={address.value}
                        onChangeText={text => setAddress({ value: text, error: '' })}
                        error={!!address.error}
                        errorText={address.error}
                    />

                    <TextInput
                        label="Phone number"
                        returnKeyType="done"
                        value={phoneNumber.value}
                        onChangeText={text => setPhoneNumber({ value: text, error: '' })}
                        error={!!phoneNumber.error}
                        errorText={phoneNumber.error}
                        keyboardType="phone-pad"
                        textContentType="telephoneNumber"
                    />
                </ScrollView>

                {(submitted && updateError && updateError.length) ? <Text style={styles.errorText}>{updateError}</Text> : null}


                <View style={styles.container}>
                    <Button mode="contained" onPress={_onUpdatePressed} style={styles.button}>
                        Update
                    </Button>
                </View>

            </PlainBackground>
            <StatusBar style="light" />
        </>
    );
};


const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        margin: 48,
        right: 0,
        bottom: 0,
        backgroundColor: colors.light
    },
    label: {
        color: theme.colors.secondary,
    },
    button: {
        marginTop: 24,
    },
    row: {
        flexDirection: 'row',
        marginTop: 4,
        paddingBottom: 16
    },
    link: {
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    container: {
        paddingLeft: 16,
        paddingRight: 16
    },
    errorText: {
        flexDirection: 'row',
        margin: 16,
        color: theme.colors.error,
    }
});

export default memo(EditProfile);