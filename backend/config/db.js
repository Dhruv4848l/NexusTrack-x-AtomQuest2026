const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing in backend/.env');
    process.exit(1);
  }

  const tryConnect = () => mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  try {
    const conn = await tryConnect();
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    return;
  } catch (err) {
    // `mongodb+srv://` resolves the cluster via a DNS SRV lookup using the system
    // resolver, which some local/ISP networks intermittently refuse
    // (querySrv ECONNREFUSED / EAI_AGAIN). Fall back to public resolvers and retry
    // once. On hosts with healthy DNS (e.g. Render) the first attempt succeeds and
    // this branch never runs, so production behaviour is unchanged.
    const isDnsError = /querySrv|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEOUT/i.test(err.message);
    if (isDnsError) {
      console.warn(`⚠️  DNS SRV lookup failed (${err.message}). Retrying via public DNS (8.8.8.8 / 1.1.1.1)…`);
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await tryConnect();
        console.log(`✅ MongoDB Atlas Connected (public DNS fallback): ${conn.connection.host}`);
        return;
      } catch (err2) {
        console.error(`❌ MongoDB connection error after DNS fallback: ${err2.message}`);
        process.exit(1);
      }
    }
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
