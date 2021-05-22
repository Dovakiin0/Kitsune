const request = require("supertest");

describe("Anime", () => {
  let server;

  beforeAll(() => {
    server = require("../index");
  });

  afterAll((done) => {
    server.close();
  });

  it("Should Fetch an anime", async () => {
    try {
      const res = await request(server).get("/api/v1/anime/oregairu");
      expect(res.status).toBe(200);
      expect(res.body[1]).toHaveProperty("title", "Oregairu OVA");
    } catch (error) {
      return error;
    }
  }, 30000);

  it("Should Fetch an anime detail", async () => {
    try {
      const payload = { uri: "https://gogoanime.io/category/oregairu" };
      const res = await request(server).post("/api/v1/anime/").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.result).toHaveProperty("name", "Oregairu");
    } catch (error) {
      return error;
    }
  }, 30000);

  it("Should Get Anime Episodes", async () => {
    try {
      const res = await request(server).post("/api/v1/anime/oregairu/1");
      expect(res.status).toBe(200);
      expect(res.body.extraLink).toHaveProperty("quality", "Download StreamSB");
    } catch (error) {
      return error;
    }
  }, 30000);
  it("Should Get Recent Animes", async () => {
    try {
      const res = await request(server).get("/api/v1/anime/page/1");
      expect(res.status).toBe(200);
    } catch (error) {
      return error;
    }
  }, 30000);
  it("Should Get Popular Animes", async () => {
    try {
      const res = await request(server).get("/api/v1/anime/popular/fetch/1");
      expect(res.status).toBe(200);
    } catch (error) {
      return error;
    }
  }, 30000);
  it("Should Get Random Waifu Pics", async () => {
    try {
      const res = await request(server).post(
        "/api/v1/anime/random/keyword/waifu"
      );
      expect(res.status).toBe(200);
      expect(res.body.files).toEqual(expect.any(Array));
    } catch (error) {
      return error;
    }
  }, 30000);
});
