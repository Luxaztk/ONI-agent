import 'dotenv/config';
import { getVectorStore } from '../electron/infrastructure/vectorDb';

async function testRealSearch() {
  console.log("=== KIỂM TRA TRA CỨU VECTOR VỚI LANCEDB HOÀN CHỈNH ===");
  try {
    const vectorStore = await getVectorStore();
    console.log("Đã lấy được vectorStore instance. Đang thực hiện similaritySearch...");
    
    const results = await vectorStore.similaritySearch("SPOM Self-Powering Oxygen Module Electolzyer", 5);
    console.log(`✅ TRA CỨU THÀNH CÔNG! Tìm thấy ${results.length} tài liệu:`);
    
    results.forEach((doc, idx) => {
      console.log(`\n--- Kết quả ${idx + 1} ---`);
      console.log(`Title: ${doc.metadata?.title || 'N/A'}`);
      console.log(`Source: ${doc.metadata?.source || 'N/A'}`);
      console.log(`Content: ${doc.pageContent.slice(0, 150)}...`);
    });
  } catch (e: any) {
    console.error("❌ Lỗi khi tra cứu:", e);
  }
}

testRealSearch().catch(console.error);
