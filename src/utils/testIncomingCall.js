/**
 * Quick test helper for incoming call toast
 *
 * Usage in browser DevTools console:
 *
 * // Import in main.js or use directly in console
 * import { testIncomingCall, clearIncomingCall } from '@/utils/testIncomingCall';
 *
 * // Show test toast
 * testIncomingCall();
 *
 * // Show with custom data
 * testIncomingCall('Jane Smith', 'jane.smith@company.com');
 *
 * // Clear toast
 * clearIncomingCall();
 */

import { useMeetingsStore } from '@/storage/meetings';

/**
 * Trigger a test incoming call notification
 * @param {string} callerName - Name of the caller (default: 'Test Caller')
 * @param {string} meetingDetails - Meeting details (default: 'test@example.com')
 * @param {string} meetingId - Meeting ID (default: auto-generated)
 */
export function testIncomingCall(
    callerName = 'Test Caller',
    meetingDetails = 'test@example.com',
    meetingId = `test-${Date.now()}`
) {
    const meetingsStore = useMeetingsStore();

    console.log('Testing incoming call:', {
        callerName,
        meetingDetails,
        meetingId
    });

    meetingsStore.setIncomingCall({
        meetingId,
        callerName,
        meetingDetails
    });

    console.log('Incoming call toast should appear in bottom-right');
    console.log('Click "Answer" or "Decline" to test buttons');
    console.log('Wait 30 seconds to test auto-decline');

    return meetingId;
}

/**
 * Clear the incoming call toast
 */
export function clearIncomingCall() {
    const meetingsStore = useMeetingsStore();
    meetingsStore.clearIncomingCall();
    console.log('Incoming call cleared');
}

/**
 * Test multiple incoming calls in sequence
 */
export async function testMultipleCalls() {
    console.log('Testing multiple incoming calls...');

    const calls = [
        { name: 'Alice Johnson', details: 'alice@company.com' },
        { name: 'Bob Smith', details: 'bob@company.com' },
        { name: 'Charlie Brown', details: 'charlie@company.com' }
    ];

    for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        console.log(`Call ${i + 1}/${calls.length}: ${call.name}`);

        testIncomingCall(call.name, call.details);

        // Wait 5 seconds before next call
        await new Promise(resolve => setTimeout(resolve, 5000));
        clearIncomingCall();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Multiple calls test complete');
}

/**
 * Test edge cases
 */
export function testEdgeCases() {
    console.log('Testing edge cases...');

    // Test 1: Unknown caller
    console.log('\n📞 Test 1: Unknown caller');
    testIncomingCall('', '');
    setTimeout(() => {
        clearIncomingCall();

        // Test 2: Long name
        console.log('\n📞 Test 2: Long name');
        testIncomingCall(
            'Very Long Name That Should Be Truncated Properly In The UI',
            'very.long.email.address@subdomain.company.com'
        );

        setTimeout(() => {
            clearIncomingCall();

            // Test 3: Special characters
            console.log('\n📞 Test 3: Special characters');
            testIncomingCall(
                'John "Johnny" O\'Brien',
                'john.obrien+test@example.com'
            );
        }, 3000);
    }, 3000);
}

/**
 * Simulate a realistic incoming call flow
 */
export async function simulateRealCall() {
    console.log('🧪 Simulating realistic incoming call...');

    const callers = [
        'Sarah Williams',
        'Michael Chen',
        'Emily Rodriguez',
        'David Kim'
    ];

    const randomCaller = callers[Math.floor(Math.random() * callers.length)];
    const email = randomCaller.toLowerCase().replace(' ', '.') + '@example.com';

    console.log(`\n📞 Incoming call from ${randomCaller}...`);

    const meetingId = testIncomingCall(randomCaller, email);

    console.log('\n💡 Tips:');
    console.log('  • Click "Answer" to simulate joining the call');
    console.log('  • Click "Decline" to reject the call');
    console.log('  • Wait 30 seconds for auto-decline');
    console.log(`  • Meeting ID: ${meetingId}`);

    return meetingId;
}

/**
 * Auto-test the full flow
 */
export async function autoTest() {
    console.log('🤖 Running automated test sequence...\n');

    // Test 1: Show and auto-clear
    console.log('Test 1: Show and auto-clear after 3 seconds');
    testIncomingCall('Auto Test 1', 'auto1@test.com');
    await new Promise(resolve => setTimeout(resolve, 3000));
    clearIncomingCall();

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Multiple rapid calls
    console.log('\nTest 2: Rapid successive calls');
    for (let i = 0; i < 3; i++) {
        testIncomingCall(`Rapid Call ${i + 1}`, `rapid${i}@test.com`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        clearIncomingCall();
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test 3: Edge cases
    console.log('\nTest 3: Edge cases');
    testIncomingCall('', ''); // Unknown caller
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearIncomingCall();

    console.log('\n✅ Automated test sequence complete!');
}

// Make functions globally available in development
if (import.meta.env.DEV) {
    window.testIncomingCall = testIncomingCall;
    window.clearIncomingCall = clearIncomingCall;
    window.testMultipleCalls = testMultipleCalls;
    window.testEdgeCases = testEdgeCases;
    window.simulateRealCall = simulateRealCall;
    window.autoTest = autoTest;

    console.log('📞 Incoming Call Test Utilities Loaded');
    console.log('Available functions:');
    console.log('  • testIncomingCall(name, details)');
    console.log('  • clearIncomingCall()');
    console.log('  • simulateRealCall()');
    console.log('  • testMultipleCalls()');
    console.log('  • testEdgeCases()');
    console.log('  • autoTest()');
}
