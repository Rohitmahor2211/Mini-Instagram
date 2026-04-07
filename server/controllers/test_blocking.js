const mongoose = require('mongoose');
const userSchema = require('../modal/user.schema');
require('dotenv').config({ path: '../.env' });

async function testBlocking() {
    try {
        // console.log("Connecting to Database...");
        await mongoose.connect(process.env.DB_URI);
        // console.log("Connected.");

        // 1. Find two test users
        const users = await userSchema.find().limit(2);
        if (users.length < 2) {
            console.error("Need at least 2 users in DB to test blocking.");
            process.exit(1);
        }

        const userA = users[0];
        const userB = users[1];

        // console.log(`Testing: ${userA.profileName} (A) blocking ${userB.profileName} (B)`);

        // 2. Clear any existing blocks first
        await userSchema.findByIdAndUpdate(userA._id, { $pull: { blockedUsers: userB._id } });
        
        // 3. Block User B
        await userSchema.findByIdAndUpdate(userA._id, { $addToSet: { blockedUsers: userB._id } });
        
        // 4. Verify Block
        const updatedA = await userSchema.findById(userA._id);
        const isBlocked = updatedA.blockedUsers.includes(userB._id);
        // console.log(`User B blocked by User A: ${isBlocked ? "PASS" : "FAIL"}`);

        // 5. Unblock User B
        await userSchema.findByIdAndUpdate(userA._id, { $pull: { blockedUsers: userB._id } });
        
        // 6. Verify Unblock
        const unblockedA = await userSchema.findById(userA._id);
        const isStillBlocked = unblockedA.blockedUsers.includes(userB._id);
        // console.log(`User B unblocked by User A: ${!isStillBlocked ? "PASS" : "FAIL"}`);

        // console.log("Blocking Logic Verification Complete.");
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

testBlocking();
