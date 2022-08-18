import { useEffect, useState, } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const manifest = Constants.manifest || Constants.manifest2,
	extra = manifest?.extra?.expoClient?.extra || manifest?.extra,
	experienceId = extra?.experienceId;


export const parseResponse = (notification) => {
	if (notification.notification) {
		notification = notification.notification;
	}
	const body = notification?.request?.content?.body,
		title = notification?.request?.content?.title,
		data = notification?.request?.content?.data;
	return {
		body,
		title,
		data,
	};
};

export const askForNotificationPermission = async () => {
	const {
			status: existingStatus
		} = await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	if (existingStatus !== 'granted') {
		const {
			status
		} = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	if (finalStatus !== 'granted') {
		return false;
	}

	if (Platform.OS === 'android') {
		Notifications.setNotificationChannelAsync('default', {
			name: 'default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
		});
	}

	return true;
};

const useNotifications = (args) => {

	const {
			onNotificationReceived,
			onNotificationDropped,
			onNotificationResponseReceived,
			getExpoPushToken,
			options = {
				alert: true,
				sound: true,
				badge: false,
			},
		} = args,
		[askedPermissions, setAskedPermissions] = useState(false);

	if (Device.isDevice) {

		useEffect(() => {
			
			askForNotificationPermission()
				.then((granted) => {
					if (!granted) {
						Alert.alert('Notifications', 'Notifications are not allowed. This functionality will be disabled until permissions are given.');
						return;
					}

					let responseListener = null,
						responseDroppedListener = null,
						responseReceivedListener = null;
					if (onNotificationReceived) { // For whenever a new notification is received
						responseListener = Notifications.addNotificationReceivedListener((notification) => {
							const response = parseResponse(notification);
							onNotificationReceived(response);
						});
					}
					if (onNotificationDropped) { // For whenever some notifications have been dropped
						responseDroppedListener = Notifications.addNotificationsDroppedListener((notification) => {
							const response = parseResponse(notification);
							onNotificationDropped(response);
						});
					}
					if (onNotificationResponseReceived) { // For whenever user interacts with a notification
						responseReceivedListener = Notifications.addNotificationResponseReceivedListener((notification) => {
							const response = parseResponse(notification);
							onNotificationResponseReceived(response);
						});
					}
					if (getExpoPushToken) {
						Notifications.getExpoPushTokenAsync({
							experienceId
						}).then((token) => {
							getExpoPushToken(token);
						}).catch((err) => {
							Alert.alert('Debug', err.toString());
							console.log(err);
						});
					}
					
					return () => {
						if (responseListener) {
							Notifications.removeNotificationSubscription(responseListener);
						}
						if (responseDroppedListener) {
							Notifications.removeNotificationSubscription(responseDroppedListener);
						}
						if (responseReceivedListener) {
							Notifications.removeNotificationSubscription(responseReceivedListener);
						}
					};
				}).catch((err) => {
					console.log(err);
				}).finally(() => {
					setAskedPermissions(true);
				});
			
			Notifications.setNotificationHandler({
				handleNotification: async () => ({
					shouldShowAlert: options.alert,
					shouldPlaySound: options.sound,
					shouldSetBadge: options.badge,
				}),
			});
		}, []);
	}

	return [
		askedPermissions,
	];
};

export default useNotifications;