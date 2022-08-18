import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert, Button, } from 'react-native';
import { useEffect, useState, } from 'react';
import useNotifications from './useNotifications';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export default function App() {
	const
		[isReady, setIsReady] = useState(false),
		[token, setToken] = useState(false),
		[askedNotificationPermissions] = useNotifications({
			onNotificationReceived: (notification) => {
				debugger;
			},
			getExpoPushToken: (token) => {
				setToken(token?.data);
			},
		}),
		onTriggerManualNotification = async () => {
			await Notifications.scheduleNotificationAsync({
				content: {
					body: 'Test',
				},
				trigger: {
					seconds: 1
				},
			});
			Alert.alert('Notice', 'Notification triggered.');
		};

	useEffect(() => {
		if (Device.isDevice && askedNotificationPermissions) {
			setIsReady(true);
		}
	}, [askedNotificationPermissions]);

	if (!isReady) {
		return null;
	}

	return (
		<View style={styles.container}>
			<Text>TestApp to demonstrate that notifications don't work for iOS on dev clients</Text>
			{token ? <Text>Use push notification tool to send a token to: {token}</Text> : null}

			<StatusBar style="auto" />
			
			{askedNotificationPermissions ? <Button
				onPress={onTriggerManualNotification}
				title="Trigger Notification"
			/> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
