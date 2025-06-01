import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import EmailTemplate from '@/lib/models/EmailTemplate';

export async function GET() {
  await dbConnect();
  const templates = await EmailTemplate.find();
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const { name, type, subject, body } = await req.json();
  const template = await EmailTemplate.create({ name, type, subject, body });
  return NextResponse.json(template, { status: 201 });
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  const { id, name, type, subject, body } = await req.json();
  const template = await EmailTemplate.findByIdAndUpdate(id, { name, type, subject, body }, { new: true });
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(template);
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const { id } = await req.json();
  const template = await EmailTemplate.findByIdAndDelete(id);
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
} 