import { V4 } from "paseto";
import fs from "fs";
import { NextFunction, Request, Response } from "express";
import { Env } from "../env";

const secKey = "src/encryption/private_key.pem" as string;
const pubKey = "src/encryption/private_key.pem" as string;

const createToken = async (email: string) => {
	const secretKey = Env.TOKEN_SECRET;
	const data = { email, secretKey };
	const privateKey = fs.readFileSync(secKey);
	const token = await V4.sign(data, privateKey, { expiresIn: "1440m" });
	return token;
};

const tempToken = async (email: string) => {
	const secretKey = Env.TOKEN_SECRET;
	const data = { email, secretKey };
	const privateKey = fs.readFileSync(secKey);
	const token = await V4.sign(data, privateKey, { expiresIn: "5m" });
	return token;
};

const authMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const tokenHeader: string = req.headers.authorization as string;
	const token: string = tokenHeader.split(" ")[1];

	if (tokenHeader == null || token == null) {
		res.status(401).json({
			message: "UNAUTHORIZED REQUEST: Token Missing",
		});
		return;
	}

	const publicKey = fs.readFileSync(pubKey);
	try {
		const payLoad = await V4.verify(token, publicKey);
		const emailCheck = req.body.email === payLoad["email"];
		const companyMailCheck = req.body.companyMail === payLoad["email"];
		if (
			payLoad["secretKey"] === Env.TOKEN_SECRET &&
			(emailCheck || companyMailCheck)
		) {
			next();
		} else {
			res.status(403).send({
				message: "FORBIDDEN ACCESS",
			});
			return;
		}
	} catch (err) {
		res.status(403).send({
			message: "FORBIDDEN ACCESS",
		});
		return;
	}
};

export { createToken, tempToken, authMiddleware };
