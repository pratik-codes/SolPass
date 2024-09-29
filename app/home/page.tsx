"use client"

import { useState, useEffect } from 'react'

import VaultCard from '@/components/dashboard/vault-card'
import PasswordDetails from '@/components/dashboard/password-details'
import { uuid } from 'uuidv4';
import { Input } from '@/components/ui/input'
import PasswordEditAdd from "@/components/dashboard/add-edit-password";
import { decryptData, decryptPrivateKey, encryptData } from "@/lib/utils";

export interface Link {
  title: string,
  url: string,
  userName: string,
  email: string,
  notes: string,
  type: string,
  password: string,
}

export default function Home() {
  const [searchTerm, setSearchterm] = useState('')
  const [currentPassword, setCurrentPassword] = useState<any>({})
  const [data, setData] = useState<any>({})

  useEffect(() => {
    if (sessionStorage.getItem('pbk') === null || sessionStorage.getItem('pk') === null) {
      document.cookie = "pk=false";
      window.location.reload();
    }
  }, [])

  const addLink = (link: Link) => {
    const oldPasswords = data?.vault?.passwords || []
    const newData = {
      ...data,
      vault: {
        ...data.vault,
        passwords: [
          ...oldPasswords,
          {
            id: uuid(),
            title: link.title,
            url: link.url,
            userName: link.userName,
            email: link.email,
            notes: link.notes,
            type: link.type,
            password: link.password,
          },
        ],
      },
    };
    setData(newData);
    encryptAndStoreData(newData)
  }

  const editLink = (id: string, link: Link) => {
    const oldVault = data?.vault || {};
    const newData = {
      ...data,
      vault: {
        ...oldVault,
        passwords: data?.vault?.passwords.map((password: any) => {
          if (password.id === id) {
            return {
              id: password.id,
              title: link.title,
              url: link.url,
              userName: link.userName,
              email: link.email,
              notes: link.notes,
              type: link.type,
              password: link.password,
            };
          }
          return password;
        }),
      },
    };
    setData(newData);
    setCurrentPassword({ ...currentPassword, ...link })
    encryptAndStoreData(newData);
  }

  const deleteLink = (id: string) => {
    const newData = {
      ...data,
      vault: {
        ...data.vault,
        passwords: data.vault.passwords.filter(
          (password: any) => password.id !== id
        ),
      },
    };
    setData(newData);
    if (currentPassword.id === id) {
      setCurrentPassword({})
    }
    encryptAndStoreData(newData);
  }

  const setCurrentPasswordHandler = (id: string) => {
    const selectedPassword = data.vault.passwords.find(
      (password: any) => password.id === id
    );

    setCurrentPassword({ ...selectedPassword })
  }

  const encryptAndStoreData = (data: any) => {
    setTimeout(() => {
      const ecryptedData = encryptData(JSON.stringify(data));
      console.log("setting data", { ecryptedData, data })
      localStorage.setItem('data', ecryptedData)
    }, 1000)
  }

  useEffect(() => {
    const decryptedPrivateKey = decryptPrivateKey(
      String(sessionStorage.getItem("pk")) || "",
      process.env.NEXT_PUBLIC_ENCRYPTION_KEY || ""
    );
    console.log({ decryptedPrivateKey })
    const message = decryptData(localStorage.getItem("data") || "");
    console.log({ message })
    if (message !== "") {
      setData(JSON.parse(message))
    }
  }, [])

  return (
    <div className="flex h-full">
      <div className="w-5/12 h-12/12 border-r ">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Input
              onChange={(e) => setSearchterm(e.target.value)}
              placeholder="Search"
              className=""
            />
            <PasswordEditAdd
              type="add"
              vault={data.vault}
              addLink={(link: Link) => addLink(link)}
              editLink={(id: string, link: Link) => editLink(id, link)}
            />
          </div>
          {data?.vault?.passwords ? (
            data?.vault?.passwords
              .filter(
                (vault: any) =>
                  vault.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  vault.userName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  vault.email
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  vault.url.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((vault: any, index: any) => (
                <VaultCard
                  title={vault.title}
                  url={vault.url}
                  userName={vault.userName}
                  email={vault.email}
                  notes={vault.notes}
                  key={vault.id}
                  id={vault.id}
                  type={vault.type}
                  setCurrentPasswordHandler={setCurrentPasswordHandler}
                  currentPassword={currentPassword}
                  deleteLink={(id: string) => deleteLink(id)}
                />
              ))
          ) : (
            <div className="mx-auto p-4 rounded-xl text-lg text-end font-bold">
              No data :( Add a new password here ☝️
            </div>
          )}
        </div>
      </div>
      <div className="w-8/12 p-4">
        {currentPassword.id && (
          <PasswordDetails
            title={currentPassword?.title}
            url={currentPassword?.url}
            userName={currentPassword?.userName}
            email={currentPassword.email}
            notes={currentPassword.notes}
            key={currentPassword.id}
            id={currentPassword.id}
            type={currentPassword?.type}
            password={currentPassword?.password}
            vault={data.vault}
            editLink={(id: string, link: Link) => editLink(id, link)}
            deleteLink={(id: string) => deleteLink(id)}
          />
        )}
        {!currentPassword.id && (
          <div className="flex flex-col items-center justify-center mt-[8rem]">
            <div className="flex flex-col space-y-3">
              <div className="text-2xl font-bold">NO DATA SELECTED 🚫</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
