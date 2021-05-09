const app = require("../index");
const request = require("supertest");

describe("Anime", () => {
  it("Should Fetch an anime", async () => {
    const res = await request(app).get("/api/v1/anime/oregairu");
    expect(res.status).toBe(200);
    expect(res.body[1]).toHaveProperty("name", "Oregairu OVA");
  }, 30000);

  it("Should Fetch an anime detail", async () => {
    const payload = { uri: "https://gogoanime.io/category/oregairu" };
    const res = await request(app).post("/api/v1/anime/").send(payload);
    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty("name", "Oregairu");
  }, 30000);

  it("Should Get Anime Episodes", async () => {
    const payload = { uri: "https://gogoanime.io/category/oregairu" };
    const res = await request(app)
      .post("/api/v1/anime/episode/1")
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.videoLinks[1]).toHaveProperty("name", "Multi quality");
  }, 30000);
  it("Should Get Recent Animes", async () => {
    const res = await request(app).get("/api/v1/anime/page/1");
    expect(res.status).toBe(200);
  }, 30000);
  it("Should Get Popular Animes", async () => {
    const res = await request(app).get("/api/v1/anime/popular/fetch/1");
    expect(res.status).toBe(200);
  }, 30000);
  it("Should Get Random Waifu Pics", async () => {
    const res = await request(app).post("/api/v1/anime/random/keyword/waifu");
    expect(res.status).toBe(200);
    expect(res.body.files).toEqual(expect.any(Array));
  }, 30000);
});
